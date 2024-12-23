import { tap } from 'rxjs/operators';
import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { NGXLogger } from 'ngx-logger';
import { ErrorHandlerService } from '../services/error/error-handler.service';
import { ErrorMapperService } from '../services/error/error-mapper.service';
import { LoadingService } from '../services/loading.service';

export const httpErrorInterceptor: HttpInterceptorFn = (req, next) => {

    const _logger = inject(NGXLogger);
    const errorHandlerService = inject(ErrorHandlerService);
    const errorMapper = inject(ErrorMapperService);
    const loadingService = inject(LoadingService);

    return next(req).pipe(
        tap({
            error: (error) => {
                const skipErrorHandling = req.headers.get('X-Skip-Error-Handling');
                if (skipErrorHandling) return;

                _logger.error('Erreur détectée :', {
                    status: error.status,
                    message: error.message,
                    url: req.url,
                });
                loadingService.hideLoading();
                if (error.status >= 400) {
                    const code = error.error?.code;
                    const detail = error.error?.detail;
                    const errorMapping = errorMapper.getErrorMapping(code, detail);
                    const messageToShow = errorMapping.translatedMessage;

                    errorHandlerService.showError(messageToShow, errorMapping.closable); // Afficher le message d’erreur spécifique
                } else if (error.status >= 500) {
                    errorHandlerService.showError('Erreur serveur. Veuillez réessayer plus tard.', false);
                }
            },
        })
    );
};

