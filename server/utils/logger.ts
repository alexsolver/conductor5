import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

// Configuração de níveis de log personalizados
const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Configuração de cores para cada nível
const logColors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue',
};

winston.addColors(logColors);

// Formato personalizado para logs
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.prettyPrint()
);

// Formato para console em desenvolvimento
const consoleFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    let log = `${timestamp} [${level}]: ${message}`;
    if (stack) {
      log += `\n${stack}`;
    }
    if (Object.keys(meta).length > 0) {
      log += `\n${JSON.stringify(meta, null, 2)}`;
    }
    return log;
  })
);

// Configuração de transports
const transports: winston.transport[] = [];

// Console transport para desenvolvimento
if (process.env.NODE_ENV !== 'production') {
  transports.push(
    new winston.transports.Console({
      level: 'debug',
      format: consoleFormat,
    })
  );
}

// File transports para produção
if (process.env.NODE_ENV === 'production') {
  // Log geral com rotação diária
  transports.push(
    new DailyRotateFile({
      filename: 'logs/application-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d',
      level: 'info',
      format: logFormat,
    })
  );

  // Log de erros separado
  transports.push(
    new DailyRotateFile({
      filename: 'logs/error-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '30d',
      level: 'error',
      format: logFormat,
    })
  );
}

// Criar instância do logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
  levels: logLevels,
  format: logFormat,
  transports,
  exitOnError: false,
});

// Enhanced logging utility with structured format and monitoring
interface LogMetadata {
  operation?: string;
  tenantId?: string;
  userId?: string;
  module?: string;
  timestamp?: string;
  requestId?: string;
  [key: string]: any;
}

// Função auxiliar para logging de erros com contexto
export const logError = (message: string, error: any, metadata?: LogMetadata) => {
  const errorLog = {
    level: 'ERROR',
    message,
    error: {
      name: error?.name,
      message: error?.message,
      stack: error?.stack,
      code: error?.code
    },
    metadata: {
      ...metadata,
      timestamp: new Date().toISOString(),
      severity: 'high'
    }
  };

  console.error(JSON.stringify(errorLog, null, 2));

  // Critical error monitoring
  if (isCriticalError(error)) {
    logCritical('CRITICAL ERROR DETECTED', error, metadata);
  }
};

export const logCritical = (message: string, error?: any, metadata?: LogMetadata) => {
  const criticalLog = {
    level: 'CRITICAL',
    message,
    error: error ? {
      name: error?.name,
      message: error?.message,
      stack: error?.stack
    } : null,
    metadata: {
      ...metadata,
      timestamp: new Date().toISOString(),
      severity: 'critical',
      alertRequired: true
    }
  };

  console.error('🚨 CRITICAL:', JSON.stringify(criticalLog, null, 2));
};

const isCriticalError = (error: any): boolean => {
  const criticalPatterns = [
    'ECONNREFUSED',
    'ENOTFOUND',
    'MODULE_NOT_FOUND',
    'TENANT_VALIDATION_FAILED',
    'AUTH_CRITICAL_FAILURE'
  ];

  return criticalPatterns.some(pattern => 
    error?.code?.includes(pattern) || 
    error?.message?.includes(pattern)
  );
};

// Função auxiliar para logging de info com contexto
export const logInfo = (message: string, metadata?: LogMetadata) => {
  logger.info({ message, ...(metadata && { context: metadata }) });
};

// Função auxiliar para logging de warning com contexto
export const logWarn = (message: string, context?: Record<string, any>) => {
  logger.warn({ message, ...(context && { context }) });
};

// Função auxiliar para logging de debug
export const logDebug = (message: string, context?: Record<string, any>) => {
  logger.debug({ message, ...(context && { context }) });
};

// Função auxiliar para logging de HTTP requests
export const logHttp = (message: string, context?: Record<string, any>) => {
  logger.http({ message, ...(context && { context }) });
};

export default logger;