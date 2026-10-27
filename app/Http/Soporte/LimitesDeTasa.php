<?php

namespace App\Http\Soporte;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;

/**
 * Limitadores con nombre que usan las rutas con `throttle:<nombre>`. Se registran al arrancar
 * (`bootstrap/app.php` → `booted`). Superar el límite responde 429 `DEMASIADOS_INTENTOS`.
 *
 * | Nombre      | Límite                         | Uso                                  |
 * |-------------|--------------------------------|--------------------------------------|
 * | `login`     | 5 por minuto por correo + IP   | `POST api/panel/auth/login`          |
 * | `recuperar` | 3 por hora por IP              | `POST api/panel/auth/recuperar`      |
 * | `publico`   | 120 por minuto por IP          | todo `api/publico/*` (automático)    |
 * | `consultas` | 5 por hora por IP              | `POST api/publico/consultas`         |
 * | `visitas`   | 60 por minuto por IP           | `POST api/publico/visitas`           |
 */
final class LimitesDeTasa
{
    public static function registrar(): void
    {
        RateLimiter::for('login', static fn (Request $request): Limit => Limit::perMinute((int) config('portal.limites.login_por_minuto', 5))
            ->by(Str::lower(trim((string) $request->input('correo'))).'|'.$request->ip()));

        RateLimiter::for('recuperar', static fn (Request $request): Limit => Limit::perHour((int) config('portal.limites.recuperar_por_hora', 3))
            ->by('recuperar|'.$request->ip()));

        RateLimiter::for('publico', static fn (Request $request): Limit => Limit::perMinute((int) config('portal.limites.publico_por_minuto', 120))
            ->by('publico|'.$request->ip()));

        RateLimiter::for('consultas', static fn (Request $request): Limit => Limit::perHour((int) config('portal.limites.consultas_por_hora', 5))
            ->by('consultas|'.$request->ip()));

        RateLimiter::for('visitas', static fn (Request $request): Limit => Limit::perMinute((int) config('portal.limites.visitas_por_minuto', 60))
            ->by('visitas|'.$request->ip()));
    }
}
