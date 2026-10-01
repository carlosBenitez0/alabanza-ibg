# Guía de capacitación — Alabanza IBG

Guía para presentar el sistema al ministerio de alabanza y enseñar a cada persona lo que le toca hacer.
Está pensada para **una sesión presencial de 90 a 120 minutos**, con todos usando su propio celular.

---

## 1. La idea en una frase

> **Cada quien registra o revisa lo suyo durante la semana, para que el sábado y el domingo todos lleguen sabiendo qué se canta, en qué tono y con quién.**

Repite esta frase al inicio y al final. Todo el sistema gira alrededor de ella.

---

## 2. Conceptos que todos deben entender primero

Explícalos con la pizarra antes de abrir la app. Si estos cinco quedan claros, el resto se entiende solo.

| Concepto | Qué es | Ejemplo |
|---|---|---|
| **Privilegio** | Un turno en el **culto regular** del fin de semana. Lo registra el cantante. | "Cantar alabanzas — Sábado" |
| **Evento especial** | Una **invitación fuera de lo normal**: campamento, evento unido con otras iglesias, invitación de otra iglesia. **Cualquiera** lo puede crear. | "Campamento de jóvenes 2026" |
| **Corista** | Quien acompaña con la voz en el privilegio de **otro** cantante. Puede ser cantante o músico. | Ana canta el sábado y María es su corista. |
| **Repertorio** | El catálogo de alabanzas de la iglesia, con su tono y su tablatura (acordes). | "La Bondad de Dios — G" |
| **Participación en un evento** | Cada quien **se apunta** a un evento, o el administrador lo asigna. Si te asignan, debes **confirmar** o decir que **no puedes**. | Pendiente → Confirmado |

**Privilegios que existen cada semana:**

| Día | Privilegio | Quién lo registra |
|---|---|---|
| Sábado | Cantar alabanzas | Cantante |
| Domingo | Cantar alabanzas (voz principal) | Cantante |
| Domingo | Cantar coros | Cantante |
| Domingo | Ensayar | Cantante |

### Roles en el sistema

Hay **tres roles**. Nadie más que el administrador gestiona: el resto del equipo trabaja de igual a igual.

| Rol | Cómo aparece | Qué puede hacer |
|---|---|---|
| **Cantante** | "Cantante" | Registra sus privilegios con sus alabanzas, se une como corista, crea eventos y se apunta a ellos. |
| **Músico** | **Su instrumento**: "Guitarrista", "Pianista", "Baterista", "Bajista", "Trompetista" (o varios) | Ve **todas las alabanzas de la semana** con su tablatura en el tono elegido. También puede unirse como corista, crear eventos y apuntarse. No registra privilegios de canto. |
| **Administrador** | "Administrador" | Todo lo anterior **+ el Panel Admin**: cambia roles, asigna instrumentos, asigna gente a eventos y edita cualquier evento. |

> Todos se registran como **Cantante** por defecto. El administrador cambia a los músicos a su rol y les **asigna su instrumento**.

---

## 3. Antes de la capacitación (preparación del administrador)

Hazlo uno o dos días antes. Una demo con datos vacíos no convence a nadie.

1. **Publica la versión final** de la app y comprueba que el enlace abre bien desde un celular.
2. **Corre las migraciones pendientes** en Supabase (ver `supabase/README.md`).
3. **Crea tu cuenta de administrador** y una cuenta de prueba de cantante y otra de músico, o pide a un voluntario de cada rol que se registre antes.
4. **Llena el repertorio** con las alabanzas que más se cantan (aunque sea 15 o 20), con su **tono**, y pega la **tablatura** de al menos 5.
5. **Registra un privilegio de ejemplo** para este fin de semana, con 3 alabanzas y una corista.
6. **Crea un evento especial de ejemplo** (por ejemplo, un campamento), para que en la sesión la gente se apunte en vivo.
7. Ten a mano:
   - El **enlace** de la app (mejor en un código QR proyectado).
   - Un **proyector o pantalla** con tu celular espejado, o la app abierta en la computadora.
   - La lista de quién es **músico** y **qué instrumento toca**, para asignarlo en el momento.
8. Pide a todos que lleguen con el **celular cargado** y con acceso a **su correo** (lo van a necesitar para confirmar la cuenta).

---

## 4. Agenda sugerida

| Tiempo | Bloque | Con quién |
|---|---|---|
| 0:00 – 0:10 | Bienvenida, la idea en una frase y los conceptos | Todos |
| 0:10 – 0:30 | **Módulo A:** crear cuenta, entrar, instalar la app, moverse | Todos |
| 0:30 – 0:40 | El administrador asigna roles e instrumentos en vivo | Todos (esperan) |
| 0:40 – 1:00 | **Módulo B:** cantantes | Cantantes (músicos observan) |
| 1:00 – 1:15 | **Módulo C:** músicos y tablaturas | Músicos (cantantes observan) |
| 1:15 – 1:30 | **Módulo D:** eventos especiales: crear, apuntarse, confirmar | Todos |
| 1:30 – 1:45 | **Ejercicio práctico:** armar el fin de semana real | Todos |
| 1:45 – 1:55 | Preguntas y acuerdos del equipo | Todos |
| Aparte | **Módulo E:** Panel Admin | Solo el administrador (y quien lo vaya a apoyar) |

---

## 5. Módulo A — Para todos: entrar y moverse

### A1. Crear la cuenta
1. Abre el enlace de la app → pantalla **Iniciar sesión** → toca **Regístrate**.
2. Llena **Nombre completo** (como te conocen en la iglesia), **Email**, **Contraseña**, **Confirmar contraseña** y, si quieres, **Teléfono**.
3. Aparece **"Revisa tu correo"**. Abre el correo y toca el enlace de confirmación.
4. Ya puedes iniciar sesión.

**Problemas típicos:**
- *No llegó el correo:* revisa Spam/Promociones. En la pantalla de inicio de sesión se puede pedir **Reenviar**.
- *"El enlace expiró o ya se usó":* si ya confirmaste, entra con tu contraseña. Si no, escribe tu email y pide un enlace nuevo.

### A2. Entrar
- **Con contraseña:** email + contraseña → **Iniciar sesión**.
- **Sin contraseña:** escribe tu email y toca **Enviarme un enlace para entrar**. Te llega un correo con el acceso.
- **Olvidé mi contraseña:** **¿Olvidaste tu contraseña?** → te llega un enlace para crear una nueva.

### A3. Instalar la app en el celular (muy recomendado)
- **Android (Chrome):** menú ⋮ → **Agregar a pantalla de inicio** / **Instalar app**.
- **iPhone (Safari):** botón Compartir → **Agregar a pantalla de inicio**.

Así se abre como una app normal, y el **modo escenario** de las tablaturas ocupa toda la pantalla.

### A4. Moverse por la app
En el celular hay una **barra abajo** con:

| Pestaña | Para qué |
|---|---|
| **Panel** | Lo tuyo de esta semana. Es la pantalla de inicio. |
| **Semana** | La tabla semanal: quién sirve en cada privilegio del sábado y del domingo. |
| **Repertorio** | Catálogo de alabanzas con tono y tablatura. |
| **Avisos** | Notificaciones (el número indica las que no has leído). |
| **Más** | **Eventos**, Mi Calendario, Equipo, Mi Perfil y, para el administrador, el Panel Admin. |

En la computadora, lo mismo aparece en el menú de la izquierda.

### A5. Mi Perfil (que cada uno lo haga en ese momento)
1. **Más → Mi Perfil**.
2. Revisa tu **Nombre completo** y tu **Teléfono**.
3. **Rol actual**: solo se ve. Si eres músico, ahí aparece tu instrumento. Ambos los asigna el administrador.
4. **Preferencias de avisos**: deja activado **Avisos dentro de la app**.
5. **Guardar**.

> ⚠️ Al final del perfil está **Eliminar cuenta**. Es irreversible; avisa que no lo toquen.

### A6. Avisos
- Te llegan avisos cuando alguien **registra un privilegio**, cuando te **agregan como corista**, cuando se **propone una alabanza nueva**, cuando alguien **crea un evento especial** y cuando el administrador **te asigna a un evento**.
- Cada aviso tiene un acceso directo (**Ver tabla semanal**, **Ver repertorio**, **Ver evento**).
- Puedes marcarlos como leídos uno por uno o con **Marcar todo como leído**.

### A7. Equipo
**Más → Equipo** muestra quién participa este fin de semana y en qué. Sirve para saber con quién vas a servir.

### A8. Mi Calendario
**Más → Mi Calendario** muestra los privilegios de **todo el equipo** y los eventos especiales en los que participas. Cada día dice qué hay (*Alabanzas*, *Coros*, *Ensayo*) y quién lo tiene.
- **Vista:** *Mes* (calendario) o *Lista* (agenda).
- Toca un privilegio para ver sus alabanzas, sus coristas y las notas.

---

## 6. Ahora el administrador asigna roles e instrumentos (en vivo)

Mientras todos esperan, desde **Panel Admin → Usuarios**:
1. Toca a cada músico → elige **Músico** → marca su **instrumento** (o varios) → **Guardar**.
2. Pide a todos que **recarguen la app**: los músicos verán que su **Panel** cambió y que junto a su nombre aparece su instrumento.

Así queda claro que **el panel de cada quien depende de su rol**.

---

## 7. Módulo B — Cantantes

### B1. Registrar mi privilegio (la tarea más importante)
1. En **Panel**, toca **Registrar mi privilegio** (en el celular es el botón **+** flotante).
2. **Privilegio seleccionado:** elige el tuyo (por ejemplo, *Cantar alabanzas — Sábado*).
3. **Fecha asignada:** la app la calcula sola. Si es para el fin de semana siguiente, toca **Usar próxima semana**.
4. **Mi listado de alabanzas:**
   - Escribe en el buscador y toca la alabanza del catálogo para añadirla.
   - Si no existe, escríbela completa, elige su **Tono nuevo** y añádela: queda en el catálogo para todos.
   - Ajusta el **Tono** de cada alabanza: es el tono en el que **tú** la vas a cantar.
   - Ordénalas con las flechas ↑ ↓ (el orden en que se cantarán) y quita las que no van con ✕.
5. **Coristas:** en **+ Añadir corista…** elige quién te acompaña (puede ser un cantante o un músico).
6. **Notas (opcional):** indicaciones para los músicos y coristas. Ej. *"Ensayar intro, empezar solo con piano"*.
7. **Registrar privilegio**.

> Sin conexión: si no hay internet, la app guarda el registro en el celular y lo avisa. Vuelve a guardarlo cuando tengas señal.

### B2. Editar o eliminar mi privilegio
- En **Panel**, en la tarjeta de tu privilegio → **Editar privilegio**.
- Cambia lo necesario → **Guardar cambios**.
- Para eliminarlo: **Eliminar** → **Sí, eliminar**.

### B3. Usar la Tabla Semanal
1. Pestaña **Semana**.
2. Arriba, con **‹ ›**, cambias de semana; **Esta semana** te regresa.
3. En el celular eliges **Sábado** o **Domingo** (el número indica cuántos privilegios hay ese día).
4. Cada privilegio dice quién lo tiene y qué alabanzas va a cantar, o **"Libre — nadie se ha registrado"**.
5. Para tomar un privilegio libre: **Añadir** / **Registrar mi privilegio** en esa tarjeta.

> Los domingos, la tabla ya muestra el fin de semana siguiente. Para ver el que acaba de pasar, usa la flecha **‹**.

### B4. Ser corista de otro cantante
- En la **Tabla Semanal**, dentro del privilegio de otra persona, toca **Unirme como corista**.
- Te aparecerá en tu **Panel**, en la sección **Como Corista**, con las alabanzas de ese privilegio.
- Para salirte, toca **Salir como corista**. El dueño del privilegio (o el administrador) también puede quitarte, y la app le ofrece **Deshacer**.
- Se puede ser corista en *Cantar alabanzas* (sábado y domingo) y en *Ensayar*.

### B5. Lo que ve el cantante en su Panel
- **Mis Privilegios de la Semana**: tu privilegio principal y, debajo, el **Siguiente**.
- **Repertorio a Ensayar**: tus alabanzas. Tócalas para ver la tablatura.
- **Como Corista**: donde acompañas a otros.
- **Esta Semana** (a un lado en la computadora): resumen de quién sirve y el enlace **Ver tabla completa**.

---

## 8. Módulo C — Músicos

### C1. Mi Panel de músico
Al entrar ves **Alabanzas de la Semana**: cada privilegio de canto del fin de semana, en el orden de los cultos, con:
- Quién canta y qué día.
- La lista de alabanzas **en el tono que eligió el cantante**.
- Las coristas.

**Tu rutina:** abre el Panel a mitad de semana y ensaya cada alabanza en el tono indicado.

> Si junto a tu nombre dice "Músico" en lugar de tu instrumento, pídele al administrador que te lo asigne.

### C2. Ver una tablatura
1. Toca cualquier alabanza (en tu Panel, en la Tabla Semanal o en el Repertorio).
2. Se abre la tablatura **ya transportada al tono que eligió el cantante**.
3. Herramientas:

| Botón | Qué hace |
|---|---|
| **Lupa − / lupa +** | Achica o agranda la letra. |
| **Ajustar** | Parte las líneas largas para que quepan (los acordes pueden desalinearse). |
| **Tono − / +** | Baja o sube medio tono, solo en tu pantalla. |
| **Original** | Vuelve al tono en que está guardada la tablatura. |
| **Copiar** | Copia la tablatura para pegarla en otro lado. |
| **PDF** | Descarga la tablatura en PDF para imprimirla. |
| **Modo escenario** | Pantalla completa y sin que el celular se apague. Ideal en el atril. |

### C3. Reglas importantes para músicos
- **Cambiar el tono con − / + no afecta a nadie.** Solo cambia lo que ves.
- **Guardar en este tono** sí cambia la tablatura **para todo el equipo**. Úsalo solo si la tablatura estaba escrita en un tono equivocado.
- **Editar** cambia la tablatura para todos. Acuerden quién es responsable de corregirlas (ver sección 12).

### C4. Si también cantas
Los músicos también pueden ser coristas: en el privilegio de un cantante, toca **Unirme como corista**. Igual que en B4.

---

## 9. Módulo D — Eventos especiales (todos)

Los eventos son de **todo el equipo**: cualquiera los ve, cualquiera los crea y cada quien decide si participa.

### D1. Ver los eventos
**Más → Eventos** muestra los **Próximos** (o los **Pasados**), agrupados por mes. Se pueden filtrar por tipo: *Campamentos*, *Eventos unidos*, *Invitaciones* y *Otros*.

### D2. Crear un evento (cuando te llegue una invitación)
> Los cultos y ensayos del fin de semana **no** son eventos: van en los privilegios semanales.

1. **Eventos** → **Nuevo Evento** (en el celular, el botón **+**).
2. **Tipo:** *Campamento*, *Evento unido* (varias iglesias juntas), *Invitación* (otra iglesia nos invita) u *Otro*.
3. **Título**, **Organiza / nos invita**, **Fecha** y **Hasta** (si dura varios días), horas de **Llegada**, **Inicio** y **Fin**, **Lugar** y **Notas** para el equipo.
4. **Crear evento**. Al equipo le llega un aviso para que se apunte.

### D3. Apuntarme o salirme
1. Abre el evento (desde **Eventos** o desde el aviso → **Ver evento**).
2. En **Mi participación**, toca **Me apunto** → elige **¿Cómo participas?** (*Voz Principal*, *Coro*, *Músico*, *Sonido* o *Multimedia*) → **Apuntarme**. Quedas **Confirmado**.
3. Si ya no puedes ir: **Salirme del evento**.
4. Abajo, en **Equipo**, ves a todos los que van y su estado.

### D4. Si el administrador te asignó
Te llega el aviso **Nueva asignación** y quedas **Pendiente**. En **Mi participación** responde:
- **Confirmar** → queda **Confirmado**.
- **No puedo** → queda **Rechazado**.

Si cambian tus planes, entra de nuevo y toca **Ya no puedo asistir** (o **Sí puedo asistir**).

### D5. Editar o eliminar un evento
Solo **quien lo creó** y el **administrador** ven el botón **Editar** en el evento. Desde ahí se cambian los datos, se arma el **Repertorio** del evento (alabanzas con su tono y en orden) y se puede **Eliminar**.

> **Regla del equipo:** si te asignaron, responde en las primeras **48 horas**. Un "Pendiente" obliga al administrador a llamar a cada persona.

---

## 10. Módulo E — Administrador (sesión aparte)

Entra desde **Más → Panel Admin**. Hay cuatro secciones: **Panel Admin**, **Eventos**, **Asignaciones** y **Usuarios**.

### E1. Panel Admin
Resumen con **Total Eventos**, **Próximos Eventos**, **Miembros** y **Asignaciones Pendientes**. Cada tarjeta lleva a su sección.

### E2. Usuarios: roles e instrumentos
- **Usuarios** lista a todos, con buscador.
- Toca a una persona → elige **Cantante**, **Músico** o **Administrador** → si es músico, marca su **instrumento** (uno o varios) → **Guardar**.
- Cuando entra alguien nuevo al ministerio: que se registre y luego asígnale su rol e instrumento.

### E3. Armar el equipo de un evento
Además de que cada quien se apunte, el administrador puede asignar a cualquiera:
1. **Panel Admin → Eventos** → abre el evento → **Asignar**.
2. Elige el **Miembro** y su función: *Voz Principal*, *Coro*, *Músico*, *Sonido* o *Multimedia*.
3. La persona recibe un aviso y queda **Pendiente** hasta que responda.
4. Tocando a alguien puedes cambiar su estado a mano (por ejemplo, si te confirmó por WhatsApp) o **quitarlo** del evento.

### E4. Seguimiento en Asignaciones
**Asignaciones** muestra los próximos eventos con su gente y su estado. Filtra por **Pendiente**, **Confirmado** o **Rechazado**.
- Un evento **sin nadie** aparece como *Pendiente* con el enlace **Asignar equipo**.
- **Rutina:** revisar **Pendiente** dos veces por semana y escribir a quien no ha respondido.

### E5. Lo que el administrador vigila cada semana
- **Miércoles:** ¿todos los privilegios de la **Tabla Semanal** tienen a alguien? Si hay uno **Libre**, coordinarlo.
- **Jueves:** ¿cada privilegio tiene sus alabanzas? Los músicos necesitan tiempo para ensayar.
- **Antes de un evento:** ¿hay gente suficiente apuntada? ¿No queda nadie en **Pendiente**? ¿El repertorio está guardado?

---

## 11. Ejercicio práctico (armar el fin de semana real)

Hazlo con los datos de **este** fin de semana. Es lo que más ayuda a que todos lo aprendan.

1. **Cada cantante** con privilegio este fin de semana lo registra en ese momento, con sus alabanzas y su tono.
2. **Un cantante** agrega a otro como corista. El otro comprueba que le llegó el aviso y que lo ve en **Como Corista**.
3. **Un músico** se une como corista en el privilegio de alguien.
4. **Alguien** propone una alabanza que no está en el catálogo.
5. **Todos** abren la **Tabla Semanal** y comprueban que el fin de semana quedó completo.
6. **Los músicos** abren su **Panel**, tocan una alabanza, cambian el tono con − / + y prueban el **Modo escenario**.
7. **Un voluntario** crea un evento especial. A los demás les llega el aviso y **3 personas se apuntan**.
8. **El administrador** asigna a alguien más a ese evento; esa persona responde **Confirmar** o **No puedo**, y el administrador lo ve cambiar en **Asignaciones**.

---

## 12. Acuerdos del equipo (decídanlos al final de la sesión)

La app no impone estas reglas, así que conviene acordarlas en voz alta:

| Acuerdo | Propuesta |
|---|---|
| Fecha límite para registrar el privilegio | **Miércoles** de la semana del culto. |
| Fecha límite para tener las alabanzas definidas | **Jueves**, para que los músicos ensayen. |
| Quién crea un evento | Quien recibe la invitación la registra en **Eventos** el mismo día. |
| Apuntarse a un evento | Solo si de verdad vas a ir; si cambian tus planes, **Salirme del evento** cuanto antes. |
| Responder a una asignación | En menos de **48 horas**. |
| Quién corrige tablaturas | Uno o dos músicos responsables. El resto solo usa − / + y no toca **Editar** ni **Guardar en este tono**. |
| Proponer alabanzas nuevas | Escribir el nombre completo y correcto, y poner el enlace de YouTube en las notas. |
| Cambios de último momento | Editar en la app **y** avisar por el grupo. |

---

## 13. Hoja de bolsillo (para compartir por WhatsApp después)

**🎤 Cantante, cada semana:**
1. Panel → **Registrar mi privilegio** → alabanzas + tono + coristas → Registrar.
2. Revisa en **Semana** que todo esté bien.
3. ¿Hay un evento? **Más → Eventos** → ábrelo → **Me apunto**.

**🎸 Músico (guitarrista, pianista, baterista…), cada semana:**
1. Abre tu **Panel** → **Alabanzas de la Semana**.
2. Toca cada alabanza → ensaya en el tono indicado.
3. En el culto: **Modo escenario**.
4. ¿También cantas? **Unirme como corista**.
5. ¿Hay un evento? **Me apunto**.

**📨 ¿Te invitaron a ministrar?**
**Más → Eventos → Nuevo Evento** → llena los datos → **Crear evento**. El equipo recibe el aviso.

**🧭 Administrador, cada semana:**
1. Miércoles: **Semana** sin privilegios **Libres**.
2. Jueves: todos los privilegios con alabanzas.
3. Eventos: **Asignaciones → Pendiente** en cero antes de la fecha.

---

## 14. Preguntas frecuentes

**No me llega el correo de confirmación.**
Revisa Spam y Promociones. Desde **Iniciar sesión** puedes pedir que lo reenvíen.

**Soy músico y no veo el botón "Registrar mi privilegio".**
Es correcto. Los músicos acompañan a todos los cantantes, así que su Panel ya les muestra todas las alabanzas de la semana. Si también cantas, únete como corista.

**Soy músico y mi Panel se ve como el de un cantante.**
Tu rol todavía es Cantante. Pídele al administrador que te cambie a Músico y te asigne tu instrumento.

**¿Cómo cambio mi instrumento?**
Lo asigna el administrador desde **Usuarios**. En tu perfil solo se ve.

**No veo el Panel Admin.**
Solo aparece para el administrador.

**Creé un evento con un dato equivocado.**
Ábrelo → **Editar**. Solo quien lo creó y el administrador pueden editarlo.

**¿Por qué el domingo la tabla muestra la semana siguiente?**
Porque el domingo es el último culto de la semana. Usa la flecha **‹** para ver la anterior.

**Cambié el tono de una alabanza y a todos les cambió.**
Usaste **Guardar en este tono**. Con − / + solo cambia en tu pantalla. Para corregirlo, abre la tablatura, pon el tono correcto y guárdala de nuevo.

**Me quedé sin internet registrando mi privilegio.**
La app lo guarda en tu celular y te avisa. Ábrelo y guárdalo otra vez cuando tengas conexión.

---

## 15. Después de la capacitación

- [ ] Todos tienen cuenta confirmada y la app instalada.
- [ ] Todos los roles están correctos y cada músico tiene su instrumento (revisa **Usuarios**).
- [ ] Se compartió la **hoja de bolsillo** (sección 13) en el grupo.
- [ ] Los acuerdos de la sección 12 quedaron escritos en el grupo.
- [ ] La primera semana, el administrador revisa la Tabla Semanal el miércoles y recuerda por el grupo a quien falte.
