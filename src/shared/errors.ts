export interface ErrorDetail {
  field?: string;
  message: string;
}

export class AppError extends Error {
  public constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
    public readonly details: ErrorDetail[] = [],
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const errors = {
  unauthorized: () =>
    new AppError(401, 'UNAUTHORIZED', 'Debes iniciar sesión para realizar esta acción.'),
  invalidCredentials: () =>
    new AppError(401, 'INVALID_CREDENTIALS', 'El correo o la contraseña no son válidos.'),
  forbiddenLearner: () =>
    new AppError(404, 'LEARNER_NOT_FOUND', 'No se encontró el perfil solicitado.'),
  activityNotFound: () =>
    new AppError(404, 'ACTIVITY_NOT_FOUND', 'No se encontró la actividad solicitada.'),
  attemptNotFound: () =>
    new AppError(404, 'ATTEMPT_NOT_FOUND', 'No se encontró el intento solicitado.'),
  attemptNotEditable: () =>
    new AppError(409, 'ATTEMPT_NOT_EDITABLE', 'El intento ya no acepta modificaciones.'),
  invalidActivityStep: () =>
    new AppError(400, 'INVALID_ACTIVITY_STEP', 'El paso no pertenece a la actividad del intento.'),
};
