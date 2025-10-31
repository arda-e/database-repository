export function Transactional(): MethodDecorator {
  return function (
    _target: any,
    _propertyKey: string | symbol,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      // Get the transaction manager from this context
      const transactionManager = (this as any).transactionManager;
      
      if (!transactionManager) {
        throw new Error('@SimpleTransactional requires transactionManager property');
      }

      if (!transactionManager.runInTransaction) {
        throw new Error('@SimpleTransactional requires TransactionManager with runInTransaction method');
      }

      // Run the original method inside a transaction
      return transactionManager.runInTransaction(() =>
        originalMethod.apply(this, args)
      );
    };

    return descriptor;
  };
}