import { logger } from './Logger';

/**
 * Decorator to log method execution as a test step.
 * @param stepName - Name of the step to log
 */
export function Step(stepName: string): MethodDecorator {
  return function (target: object, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: unknown[]): Promise<unknown> {
      const name = stepName || String(propertyKey);
      logger.info(`[Step] Starting: ${name}`);
      try {
        const result = await originalMethod.apply(this, args);
        logger.info(`[Step] Completed: ${name}`);
        return result;
      } catch (error) {
        logger.error(
          `[Step] Failed: ${name} - ${error instanceof Error ? error.message : String(error)}`
        );
        throw error;
      }
    };

    return descriptor;
  };
}
