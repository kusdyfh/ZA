import { randomUUID } from 'node:crypto';
import type { Server } from 'node:http';
import { type INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../../../app.module';
import { ResponseEnvelopeInterceptor } from '../../../shared/interceptors/response-envelope.interceptor';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { ok, err } from '../../../shared/testing/auth-integration-helpers';

/** ADR 0018 — customer profile, change-password, and address book (default-address invariant). */
describe('Customers: profile + addresses (integration)', () => {
  let app: INestApplication;
  let server: Server;
  let prisma: PrismaService;
  let customerId: string;
  let accessToken: string;
  const testEmail = `profile-${randomUUID()}@example.com`;
  const testPassword = 'ProfileTest12345';

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('v1', { exclude: ['health', 'health/ready'] });
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    app.useGlobalInterceptors(new ResponseEnvelopeInterceptor());
    await app.init();
    server = app.getHttpServer() as Server;
    prisma = moduleRef.get(PrismaService);

    const register = await request(server)
      .post('/v1/customers/auth/register')
      .send({ email: testEmail, password: testPassword, firstName: 'Jane', lastName: 'Doe' });
    const body = ok<{ accessToken: string; customer: { id: string } }>(register).data;
    accessToken = body.accessToken;
    customerId = body.customer.id;
  });

  afterAll(async () => {
    await prisma.customerAddress.deleteMany({ where: { customerId } });
    await prisma.customerRefreshToken.deleteMany({ where: { customerId } });
    const customer = await prisma.customer.findUnique({ where: { id: customerId } });
    if (customer) {
      await prisma.cart.deleteMany({ where: { guestToken: customer.cartToken } });
    }
    await prisma.customer.deleteMany({ where: { id: customerId } });
    await app.close();
  });

  it('gets and updates the profile', async () => {
    const get = await request(server)
      .get('/v1/customers/me')
      .set('Authorization', `Bearer ${accessToken}`);
    expect(get.status).toBe(200);
    expect(ok<{ email: string }>(get).data.email).toBe(testEmail);

    const update = await request(server)
      .patch('/v1/customers/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ firstName: 'Janet', lastName: 'Smith', marketingOptIn: true });
    expect(update.status).toBe(200);
    const updated = ok<{ firstName: string; marketingOptIn: boolean }>(update).data;
    expect(updated.firstName).toBe('Janet');
    expect(updated.marketingOptIn).toBe(true);
  });

  it('rejects profile access with no token', async () => {
    const response = await request(server).get('/v1/customers/me');
    expect(response.status).toBe(401);
  });

  it('changes the password and revokes the current session', async () => {
    const newPassword = 'BrandNewProfilePassword987';
    const change = await request(server)
      .post('/v1/customers/me/change-password')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ currentPassword: testPassword, newPassword });
    expect(change.status).toBe(204);

    const oldLogin = await request(server)
      .post('/v1/customers/auth/login')
      .send({ email: testEmail, password: testPassword });
    expect(oldLogin.status).toBe(401);

    const newLogin = await request(server)
      .post('/v1/customers/auth/login')
      .send({ email: testEmail, password: newPassword });
    expect(newLogin.status).toBe(201);
    accessToken = ok<{ accessToken: string }>(newLogin).data.accessToken;
  });

  it('enforces exactly one default address', async () => {
    const first = await request(server)
      .post('/v1/customers/me/addresses')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        fullName: 'Jane Doe',
        phone: '+9647700000000',
        line1: '123 Al-Rasheed Street',
        city: 'Baghdad',
        governorate: 'Baghdad',
        country: 'Iraq',
        isDefault: true,
      });
    expect(first.status).toBe(201);
    const firstId = ok<{ id: string }>(first).data.id;

    const second = await request(server)
      .post('/v1/customers/me/addresses')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        fullName: 'Jane Doe',
        phone: '+9647700000001',
        line1: '456 Karrada Street',
        city: 'Baghdad',
        governorate: 'Baghdad',
        country: 'Iraq',
        isDefault: true,
      });
    expect(second.status).toBe(201);

    const list = await request(server)
      .get('/v1/customers/me/addresses')
      .set('Authorization', `Bearer ${accessToken}`);
    const addresses = ok<Array<{ id: string; isDefault: boolean }>>(list).data;
    const defaults = addresses.filter((address) => address.isDefault);
    expect(defaults).toHaveLength(1);
    expect(defaults[0]!.id).not.toBe(firstId);
  });

  it("rejects updating another customer's address", async () => {
    const otherRegister = await request(server)
      .post('/v1/customers/auth/register')
      .send({
        email: `other-${randomUUID()}@example.com`,
        password: 'OtherPassword12345',
        firstName: 'Other',
        lastName: 'Customer',
      });
    const otherToken = ok<{ accessToken: string }>(otherRegister).data.accessToken;
    const otherCustomerId = ok<{ customer: { id: string } }>(otherRegister).data.customer.id;

    const list = await request(server)
      .get('/v1/customers/me/addresses')
      .set('Authorization', `Bearer ${accessToken}`);
    const addressId = ok<Array<{ id: string }>>(list).data[0]!.id;

    const response = await request(server)
      .patch(`/v1/customers/me/addresses/${addressId}`)
      .set('Authorization', `Bearer ${otherToken}`)
      .send({
        fullName: 'Hacker',
        phone: '+9647700000002',
        line1: 'Nowhere',
        city: 'Nowhere',
        governorate: 'Nowhere',
        country: 'Nowhere',
      });
    expect(response.status).toBe(404);
    expect(err(response).error.code).toBe('ADDRESS_NOT_FOUND');

    await prisma.customerRefreshToken.deleteMany({ where: { customerId: otherCustomerId } });
    const otherCustomer = await prisma.customer.findUnique({ where: { id: otherCustomerId } });
    if (otherCustomer) {
      await prisma.cart.deleteMany({ where: { guestToken: otherCustomer.cartToken } });
    }
    await prisma.customer.deleteMany({ where: { id: otherCustomerId } });
  });
});
