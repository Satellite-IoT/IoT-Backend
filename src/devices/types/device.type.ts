import { Device } from 'src/entities';
import { FlowControlLevel } from 'src/common/enums';

export type DeviceResponse = Device & {
  flowControlLevel: FlowControlLevel;
};
