export class ErrorBanecoNoImplementado extends Error {
  constructor() {
    super('La comunicación con Baneco todavía no está implementada.');
    this.name = 'ErrorBanecoNoImplementado';
    this.codigo = 'baneco_no_implementado';
  }
}

export class ErrorBaneco extends Error {
  constructor(mensaje, codigo = 'baneco_error') {
    super(mensaje);
    this.name = 'ErrorBaneco';
    this.codigo = codigo;
  }
}
