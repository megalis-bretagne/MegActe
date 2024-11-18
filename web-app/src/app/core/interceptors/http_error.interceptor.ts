
import { tap } from 'rxjs/operators';
import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { NGXLogger } from 'ngx-logger';

export const HttpErrorInterceptor: HttpInterceptorFn = (req, next) => {

    const _logger = inject(NGXLogger);

    return next(req).pipe(
        tap({
            error: (error) => {
                console.log(req);
                if (error.status === 401) {
                    _logger.error('Action interdit', {
                        message: error.message,
                        url: req.url,
                    });
                }

                if (error.status === 400) {
                    _logger.error('Mauvaise requête envoyé');
                }

                if (error.status >= 500) {
                    _logger.error('Erreur serveur détectée :', {
                        status: error.status,
                        message: error.message,
                        url: req.url,
                    });
                }
            },
        })
    );
};

