import { ActorType } from '@za/types';
import { OrderNote, type OrderNoteProps } from './order-note.entity';

function buildNote(overrides: Partial<OrderNoteProps> = {}): OrderNote {
  const props: OrderNoteProps = {
    id: 'note-1',
    body: 'Customer requested delivery after 5pm.',
    isInternal: true,
    actorId: 'admin-1',
    actorType: ActorType.ADMIN,
    createdAt: new Date(),
    ...overrides,
  };
  return OrderNote.reconstitute(props);
}

describe('OrderNote', () => {
  it('exposes every field via getters', () => {
    const note = buildNote();
    expect(note.body).toBe('Customer requested delivery after 5pm.');
    expect(note.isInternal).toBe(true);
    expect(note.actorType).toBe(ActorType.ADMIN);
  });

  it('supports a customer-visible note', () => {
    const note = buildNote({ isInternal: false });
    expect(note.isInternal).toBe(false);
  });
});
