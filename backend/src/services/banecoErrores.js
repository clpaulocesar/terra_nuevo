export class ErrorBanecoNoImplementado extends Error {
  constructor() {
    super('La comunicación con Baneco todavía no está implementada.');
    this.name = 'ErrorBanecoNoImplementado';
    this.codigo = 'baneco_no_implementado';
  }
}
