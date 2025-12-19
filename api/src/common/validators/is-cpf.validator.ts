import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';

export function IsCPF(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'IsCPF',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: any) {
          if (typeof value !== 'string') return false;

          const cpf = value.replace(/\D/g, '');

          if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;

          const calcCheckDigit = (base: number) => {
            let sum = 0;
            for (let i = 0; i < base; i++) {
              sum += parseInt(cpf.charAt(i), 10) * (base + 1 - i);
            }
            const result = (sum * 10) % 11;
            return result === 10 ? 0 : result;
          };

          const digit1 = calcCheckDigit(9);
          const digit2 = calcCheckDigit(10);

          return (
            digit1 === parseInt(cpf.charAt(9), 10) &&
            digit2 === parseInt(cpf.charAt(10), 10)
          );
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} deve ser um CPF válido`;
        },
      },
    });
  };
}
