import { ProtocolVersionHandler } from "./ProtocolVersionHandler";
import { V1Handler } from "./v1/V1Handler";

export class ProtocolVersionRegistry {
  private static registry: ProtocolVersionHandler [] = [
      new V1Handler()
  ];

  public static getProtocolHandler(): ProtocolVersionHandler | undefined {
      for (const pv of ProtocolVersionRegistry.registry) {
        if (pv.isMyOperation()) {
            return pv;
        }
      }
      return undefined;
  }
}
