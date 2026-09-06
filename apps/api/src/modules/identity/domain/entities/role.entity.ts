export interface RoleProps {
  id: string;
  key: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * A fixed, seeded role — see
 * docs/v2/adr/0011-data-driven-rbac-schema.md for why this is a data
 * model rather than the AdminRole enum sketched in
 * docs/03-DATABASE-SCHEMA.md.
 */
export class Role {
  private constructor(private readonly props: RoleProps) {}

  static reconstitute(props: RoleProps): Role {
    return new Role(props);
  }

  get id(): string {
    return this.props.id;
  }

  get key(): string {
    return this.props.key;
  }

  get name(): string {
    return this.props.name;
  }

  get description(): string | null {
    return this.props.description;
  }

  get isSystem(): boolean {
    return this.props.isSystem;
  }

  toProps(): RoleProps {
    return { ...this.props };
  }
}
