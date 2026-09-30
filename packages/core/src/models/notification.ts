export enum HopkeyNotificationType {
  info,
  warning,
  danger,
  success,
}

export class HopkeyNotification {
  constructor(
    public uuid: string,
    public type: HopkeyNotificationType,
    public title: string,
    public buttonActionName: string,
    public description: string,
    public read: boolean,
    public link?: string,
    public icon?: string,
    public popup?: boolean
  ) {}
}
