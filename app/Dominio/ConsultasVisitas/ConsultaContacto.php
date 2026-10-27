<?php

namespace App\Dominio\ConsultasVisitas;

use App\Dominio\Compartido\Excepciones\ReglaNegocioException;

/**
 * Datos de una consulta de contacto (objeto de valor). Nombre de 3 a 150, correo válido hasta 150,
 * asunto hasta 150 y mensaje de 10 a 5000 caracteres.
 */
final readonly class ConsultaContacto
{
    public string $nombre;

    public string $correo;

    public ?string $asunto;

    public string $mensaje;

    /**
     * @throws ReglaNegocioException
     */
    public function __construct(string $nombre, string $correo, ?string $asunto, string $mensaje)
    {
        $this->nombre = trim($nombre);
        $this->correo = mb_strtolower(trim($correo));
        $asunto = $asunto === null ? null : trim($asunto);
        $this->asunto = $asunto === '' ? null : $asunto;
        $this->mensaje = trim($mensaje);

        self::largo($this->nombre, 3, 150, 'nombre', 'El nombre debe tener entre 3 y 150 caracteres.');
        self::largo($this->mensaje, 10, 5000, 'mensaje', 'El mensaje debe tener entre 10 y 5000 caracteres.');

        if (mb_strlen($this->correo) > 150 || filter_var($this->correo, FILTER_VALIDATE_EMAIL) === false) {
            throw new ReglaNegocioException('El correo no es válido.', 'correo');
        }

        if ($this->asunto !== null) {
            self::largo($this->asunto, 1, 150, 'asunto', 'El asunto no puede superar 150 caracteres.');
        }
    }

    private static function largo(string $valor, int $min, int $max, string $campo, string $mensaje): void
    {
        $largo = mb_strlen($valor);
        if ($largo < $min || $largo > $max) {
            throw new ReglaNegocioException($mensaje, $campo);
        }
    }
}
