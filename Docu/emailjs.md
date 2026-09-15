# EmailJS — destinatario y plantillas

Dos cosas distintas que se suelen confundir:

- **A quién llegan las reservas** se configura en la plantilla de EmailJS, no en el código.
- **Qué campos se ven en el correo** se configura en el HTML de la plantilla, y esos campos los manda el código.

---

## 1 · Cambiar el correo que recibe las reservas

Hoy llegan al correo de pruebas. Para que vayan al de la directora:

1. Entra en <https://dashboard.emailjs.com> con la cuenta del proyecto.
2. **Email Templates** → abre la plantilla del hotel (la del aviso interno, no la de confirmación al cliente).
3. Pestaña **Settings** de esa plantilla.
4. En **To Email** pon la dirección de la directora.
5. **Save**.

Eso es todo. No hay que tocar código ni volver a desplegar.

### Detalles que importan

**No confundas las dos plantillas.** Hay dos:

| Plantilla | Variable de entorno | A quién va | Su "To Email" |
|---|---|---|---|
| Aviso al hotel | `VITE_EMAILJS_TEMPLATE_HOTEL` | Al hotel | La dirección fija de quien gestiona |
| Confirmación al cliente | `VITE_EMAILJS_TEMPLATE_CLIENTE` | Al cliente | `{{email_cliente}}` |

En la del cliente, **el campo To Email tiene que seguir siendo `{{email_cliente}}`**. Si le pones una dirección fija, todas las confirmaciones irán a esa persona y ningún cliente recibirá la suya.

**Varios destinatarios.** El campo To Email admite varias direcciones separadas por coma:

```
direccion@suitesviena.es, reservas@suitesviena.es
```

O deja una en To Email y las demás en **Cc** o **Bcc**, en esa misma pantalla.

**Prueba antes de darlo por hecho.** Haz una reserva de prueba desde la web y comprueba que llega. Después bórrala del panel. El botón "Test It" de EmailJS manda la plantilla con datos falsos y sirve para ver el diseño, pero no prueba que la web esté enviando bien.

**Revisa el spam la primera vez.** Un remitente nuevo suele caer ahí. Que lo marque como "no es spam" y las siguientes entrarán bien.

### Si hay que cambiar de cuenta de EmailJS

Solo entonces se toca el proyecto. Las claves están en el `.env`:

```
VITE_EMAILJS_SERVICE_ID=...
VITE_EMAILJS_TEMPLATE_HOTEL=...
VITE_EMAILJS_TEMPLATE_CLIENTE=...
VITE_EMAILJS_PUBLIC_KEY=...
```

En local, editas el `.env` y reinicias `npm run dev`. En producción, las variables van en **Cloudflare Pages → Settings → Environment variables**, y hay que **volver a desplegar**: Vite las incrusta en el build, no se leen en tiempo de ejecución. Cambiarlas sin redesplegar no hace nada.

---

## 2 · Añadir el descuento a las plantillas

El código ya manda estos campos. Si no aparecen en el correo es porque la plantilla no los usa todavía.

| Variable | Qué trae | Cuándo viene vacía |
|---|---|---|
| `{{precio_base}}` | Precio de las salas, sin extras ni descuento | Nunca |
| `{{precio_extras}}` | Total de los extras | Vale 0 si no eligió ninguno |
| `{{descuento}}` | Cuánto rebaja la oferta | Vale 0 si no hubo oferta |
| `{{oferta_nombre}}` | Nombre de la oferta aplicada | Cadena vacía si no hubo |
| `{{oferta_codigo}}` | Código promocional usado | Vacío si la oferta era automática |
| `{{precio_total}}` | Lo que paga el cliente, ya con el descuento | Nunca |

`{{precio_total}}` ya llevaba el descuento restado desde que se conectaron las ofertas. O sea: **el importe del correo es correcto ahora mismo**, lo único que falta es explicar de dónde sale.

### Bloque para pegar

En el editor HTML de la plantilla, donde ahora esté el total. Sirve para las dos plantillas.

```html
<table style="width:100%;border-collapse:collapse;font-family:Arial,Helvetica,sans-serif;">
  <tr>
    <td style="padding:6px 12px;font-size:14px;color:#57534e;">Salas</td>
    <td style="padding:6px 12px;font-size:14px;color:#3D3530;text-align:right;">{{precio_base}} €</td>
  </tr>
  <tr>
    <td style="padding:6px 12px;font-size:14px;color:#57534e;">Extras</td>
    <td style="padding:6px 12px;font-size:14px;color:#3D3530;text-align:right;">{{precio_extras}} €</td>
  </tr>
  <tr>
    <td style="padding:6px 12px;font-size:14px;color:#166534;">
      Descuento{{#oferta_nombre}} — {{oferta_nombre}}{{/oferta_nombre}}
    </td>
    <td style="padding:6px 12px;font-size:14px;color:#166534;text-align:right;">−{{descuento}} €</td>
  </tr>
  <tr>
    <td style="padding:10px 12px;border-top:2px solid #e8e4df;font-size:16px;font-weight:bold;color:#3D3530;">Total</td>
    <td style="padding:10px 12px;border-top:2px solid #e8e4df;font-size:16px;font-weight:bold;color:#3D3530;text-align:right;">{{precio_total}} €</td>
  </tr>
</table>
```

**Sobre `{{#oferta_nombre}}`**: EmailJS usa Handlebars, así que esa sección solo se pinta si la variable trae algo. Pero la **fila entera del descuento no se puede ocultar así**, porque `{{descuento}}` siempre llega con un valor: cuando no hay oferta, llega `0` y verás "−0 €".

Dos maneras de resolverlo, elige una:

- **Envolver la fila.** Rodea el `<tr>` completo del descuento con `{{#oferta_nombre}}` … `{{/oferta_nombre}}`. Como ese campo sí llega vacío sin oferta, la fila desaparece. Es lo más limpio.
- **Dejarlo.** Un "−0 €" en el correo interno del hotel no molesta a nadie. En el del cliente sí conviene ocultarlo.

### Añadir el código promocional al correo del hotel

Útil para saber por qué canal llegó la reserva:

```html
{{#oferta_codigo}}
<p style="font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#57534e;">
  Código usado: <strong>{{oferta_codigo}}</strong>
</p>
{{/oferta_codigo}}
```

---

## 3 · Comprobación final

1. Crea una oferta en el panel que cubra las fechas que vas a elegir.
2. Haz una reserva desde la web y comprueba que el resumen tacha el precio.
3. Mira los dos correos: el del hotel llega a la dirección nueva y ambos enseñan el desglose con el descuento.
4. En el panel, la reserva aparece con su línea verde y sin aviso de importe.
5. En Supabase, `uses` de esa oferta ha subido en uno.
6. Borra la reserva de prueba.

Si el correo llega pero sin el descuento, es la plantilla. Si no llega, es el To Email o el spam.
