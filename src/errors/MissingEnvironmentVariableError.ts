export class MissingEnvironmentVariableError extends Error {
  public readonly variableName: string
  public readonly context?: string

  constructor(variableName: string, context?: string) {
    const prefix = context ? `[${context}] ` : ''
    super(`${prefix}Missing required environment variable: ${variableName}`)
    this.name = 'MissingEnvironmentVariableError'
    this.variableName = variableName
    this.context = context
  }
}
