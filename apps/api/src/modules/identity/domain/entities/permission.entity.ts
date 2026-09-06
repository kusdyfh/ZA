export interface PermissionProps {
  id: string;
  key: string;
  module: string;
  action: string;
  description: string | null;
  createdAt: Date;
}

/**
 * A single grantable capability, keyed `<module>.<action>` — see
 * docs/epics/EPIC-02-COMPLETION-REPORT.md for the full seeded set.
 */
export class Permission {
  private constructor(private readonly props: PermissionProps) {}

  static reconstitute(props: PermissionProps): Permission {
    return new Permission(props);
  }

  get id(): string {
    return this.props.id;
  }

  get key(): string {
    return this.props.key;
  }

  get module(): string {
    return this.props.module;
  }

  get action(): string {
    return this.props.action;
  }

  toProps(): PermissionProps {
    return { ...this.props };
  }
}
