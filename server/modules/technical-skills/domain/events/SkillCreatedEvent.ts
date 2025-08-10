
export class SkillCreatedEvent {
  constructor(
    public readonly skillId: string,
    public readonly name: string,
    public readonly category: string,
    public readonly createdAt: Date = new Date()
  ) {}
}
