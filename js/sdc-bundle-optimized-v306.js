
;/* ==== js/sdc-error-guard.js ==== */

/* SDC Error Guard: muestra un diagnóstico claro si GitHub Pages deja la pantalla en blanco. */
(function(){
  'use strict';
  var startedAt = Date.now();
  var captured = [];

  function esc(s){
    return String(s == null ? '' : s).replace(/[&<>\"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});
  }

  function hasContent(){
    var app = document.getElementById('app');
    if(!app) return false;
    var html = app.innerHTML.trim();
    if(!html) return false;
    if(app.querySelector('[data-sdc-loading="1"]')) return false;
    return true;
  }

  function show(title, message, extra){
    var app = document.getElementById('app');
    if(!app) return;
    if(hasContent()) return;

    var missing = [];
    if(!window.SDC_CONFIG) missing.push('js/data.js');
    if(!window.SDCStore) missing.push('js/storage.js');

    var details = captured.slice(-4).map(function(e){
      return '<li><b>'+esc(e.type)+':</b> '+esc(e.message || e.reason || '')+'</li>';
    }).join('');

    app.className = 'sdc-safe-error-wrap';
    app.innerHTML = ''+
      '<section class="sdc-safe-error-card">'+
        '<div class="sdc-safe-pill">SDC · revisión de carga</div>'+
        '<h1>'+esc(title || 'La página no cargó completa')+'</h1>'+
        '<p>'+esc(message || 'GitHub Pages abrió el archivo, pero algún recurso no terminó de cargar.')+'</p>'+
        '<div class="sdc-safe-box">'+
          '<b>Arreglo recomendado:</b>'+
          '<ol>'+ 
            '<li>Sube los archivos en la raíz del repositorio, no dentro de otra carpeta.</li>'+ 
            '<li>Confirma que existan las carpetas <code>css</code>, <code>js</code> y <code>assets</code>.</li>'+ 
            '<li>Abre la página con <code>?v=2</code> al final o presiona Ctrl + F5.</li>'+ 
          '</ol>'+ 
        '</div>'+ 
        (missing.length ? '<div class="sdc-safe-warn"><b>Detectado como faltante:</b> '+esc(missing.join(', '))+'</div>' : '')+
        (details ? '<details class="sdc-safe-details" open><summary>Error detectado</summary><ul>'+details+'</ul></details>' : '')+
        '<button type="button" class="sdc-safe-btn" onclick="location.reload()">Volver a cargar</button>'+ 
      '</section>';
  }

  window.SDC_SHOW_SAFE_ERROR = show;

  window.addEventListener('error', function(ev){
    captured.push({type:'Error', message: ev.message || 'Error de carga', reason: ev.filename ? ev.filename + ':' + ev.lineno : ''});
    setTimeout(function(){ show('Error al iniciar SDC', ev.message || 'Revisa que todos los archivos se hayan subido completos.'); }, 80);
  }, true);

  window.addEventListener('unhandledrejection', function(ev){
    captured.push({type:'Promesa', message: (ev.reason && (ev.reason.message || ev.reason.toString())) || 'Error interno'});
    setTimeout(function(){ show('Error interno al cargar', (ev.reason && ev.reason.message) || 'Algo falló al iniciar el panel.'); }, 80);
  });

  window.addEventListener('load', function(){
    setTimeout(function(){
      if(!hasContent()){
        show('SDC quedó detenido al cargar', 'Pasaron '+Math.round((Date.now()-startedAt)/1000)+' segundos y el panel no se dibujó.');
      }
    }, 1600);
  });
})();


;/* ==== js/data.js ==== */

/* Datos base editables. El separador de categorías es coma, punto y coma o barra vertical. */
window.SDC_CONFIG = {
  storeName: 'SD COMAYAGUA',
  whatsapp: '+504 3151-7755',
  whatsappNumber: '50431517755',
  accessKey: '199311',
  codPercent: 7,
  lowStockLimit: 3,
  currency: 'Lps.',
  firebaseMode: true,
  cloudProvider: 'Firebase',
  autoFirebaseSync: true,
  autoSheetSync: false,
  webAppUrl: ''
};

window.SDC_DEPARTMENTS = [
  'Por Definir','Atlántida','Colón','Comayagua','Copán','Cortés','Choluteca','El Paraíso','Francisco Morazán','Gracias a Dios','Intibucá','Islas de la Bahía','La Paz','Lempira','Ocotepeque','Olancho','Santa Bárbara','Valle','Yoro'
];

window.SDC_MUNICIPALITIES = {
  'Por Definir':['Por Definir'],
  'Atlántida':['La Ceiba','El Porvenir','Esparta','Jutiapa','La Masica','San Francisco','Tela','Arizona'],
  'Colón':['Trujillo','Balfate','Iriona','Limón','Sabá','Santa Fe','Santa Rosa de Aguán','Sonaguera','Tocoa','Bonito Oriental'],
  'Comayagua':['Comayagua','Ajuterique','El Rosario','Esquías','Humuya','La Libertad','Lamaní','La Trinidad','Lejamaní','Meámbar','Minas de Oro','Ojos de Agua','San Jerónimo','San José de Comayagua','San José del Potrero','San Luis','San Sebastián','Siguatepeque','Villa de San Antonio','Las Lajas','Taulabé'],
  'Copán':['Santa Rosa de Copán','Cabañas','Concepción','Copán Ruinas','Corquín','Cucuyagua','Dolores','Dulce Nombre','El Paraíso','Florida','La Jigua','La Unión','Nueva Arcadia','San Agustín','San Antonio','San Jerónimo','San José','San Juan de Opoa','San Nicolás','San Pedro','Santa Rita','Trinidad de Copán','Veracruz'],
  'Cortés':['San Pedro Sula','Choloma','Omoa','Pimienta','Potrerillos','Puerto Cortés','San Antonio de Cortés','San Francisco de Yojoa','San Manuel','Santa Cruz de Yojoa','Villanueva','La Lima'],
  'Choluteca':['Choluteca','Apacilagua','Concepción de María','Duyure','El Corpus','El Triunfo','Marcovia','Morolica','Namasigüe','Orocuina','Pespire','San Antonio de Flores','San Isidro','San José','San Marcos de Colón','Santa Ana de Yusguare'],
  'El Paraíso':['Yuscarán','Alauca','Danlí','El Paraíso','Güinope','Jacaleapa','Liure','Morocelí','Oropolí','Potrerillos','San Antonio de Flores','San Lucas','San Matías','Soledad','Teupasenti','Texiguat','Vado Ancho','Yauyupe','Trojes'],
  'Francisco Morazán':['Distrito Central','Alubarén','Cedros','Curarén','El Porvenir','Guaimaca','La Libertad','La Venta','Lepaterique','Maraita','Marale','Nueva Armenia','Ojojona','Orica','Reitoca','Sabanagrande','San Antonio de Oriente','San Buenaventura','San Ignacio','San Juan de Flores','San Miguelito','Santa Ana','Santa Lucía','Talanga','Tatumbla','Valle de Ángeles','Villa de San Francisco','Vallecillo'],
  'Gracias a Dios':['Puerto Lempira','Brus Laguna','Ahuas','Juan Francisco Bulnes','Ramón Villeda Morales','Wampusirpi'],
  'Intibucá':['La Esperanza','Camasca','Colomoncagua','Concepción','Dolores','Intibucá','Jesús de Otoro','Magdalena','Masaguara','San Antonio','San Isidro','San Juan','San Marcos de la Sierra','San Miguel Guancapla','Santa Lucía','Yamaranguila','San Francisco de Opalaca'],
  'Islas de la Bahía':['Roatán','Guanaja','José Santos Guardiola','Utila'],
  'La Paz':['La Paz','Aguanqueterique','Cabañas','Cane','Chinacla','Guajiquiro','Lauterique','Marcala','Mercedes de Oriente','Opatoro','San Antonio del Norte','San José','San Juan','San Pedro de Tutule','Santa Ana','Santa Elena','Santa María','Santiago de Puringla','Yarula'],
  'Lempira':['Gracias','Belén','Candelaria','Cololaca','Erandique','Gualcince','Guarita','La Campa','La Iguala','Las Flores','La Unión','La Virtud','Lepaera','Mapulaca','Piraera','San Andrés','San Francisco','San Juan Guarita','San Manuel Colohete','San Rafael','San Sebastián','Santa Cruz','Talgua','Tambla','Tomalá','Valladolid','Virginia','San Marcos de Caiquín'],
  'Ocotepeque':['Ocotepeque','Belén Gualcho','Concepción','Dolores Merendón','Fraternidad','La Encarnación','La Labor','Lucerna','Mercedes','San Fernando','San Francisco del Valle','San Jorge','San Marcos','Santa Fe','Sensenti','Sinuapa'],
  'Olancho':['Juticalpa','Campamento','Catacamas','Concordia','Dulce Nombre de Culmí','El Rosario','Esquipulas del Norte','Gualaco','Guarizama','Guata','Guayape','Jano','La Unión','Mangulile','Manto','Salamá','San Esteban','San Francisco de Becerra','San Francisco de la Paz','Santa María del Real','Silca','Yocón','Patuca'],
  'Santa Bárbara':['Santa Bárbara','Arada','Atima','Azacualpa','Ceguaca','Concepción del Norte','Concepción del Sur','Chinda','El Níspero','Gualala','Ilama','Las Vegas','Macuelizo','Naranjito','Nuevo Celilac','Petoa','Protección','Quimistán','San Francisco de Ojuera','San José de Colinas','San Luis','San Marcos','San Nicolás','San Pedro Zacapa','San Vicente Centenario','Santa Rita','Trinidad'],
  'Valle':['Nacaome','Alianza','Amapala','Aramecina','Caridad','Goascorán','Langue','San Francisco de Coray','San Lorenzo'],
  'Yoro':['Yoro','Arenal','El Negrito','El Progreso','Jocón','Morazán','Olanchito','Santa Rita','Sulaco','Victoria','Yorito']
};

window.SDC_DEFAULT_PRODUCTS = [
  {
    "id": "SDC-001",
    "name": "Dedales V1 - Fibra de Carbón",
    "categories": "Dedales",
    "brand": "SD Gamer",
    "price": 25,
    "cost": 8,
    "stock": 205,
    "colors": "General=205",
    "image": "https://scontent.ftgu2-3.fna.fbcdn.net/v/t45.5328-4/676160714_2011033109795906_1137673825102398072_n.jpg?stp=dst-jpg_p960x960_tt6&_nc_cat=111&ccb=1-7&_nc_sid=247b10&_nc_eui2=AeELYLJ4oE20mt5HXYNTPY0Y07cSBA2VwTvTtxIEDZXBOz3I9VGz6BDjAq6XHKs_6n--ayg8engCz7FmmDmppOkV&_nc_ohc=igkO9Ng_1WMQ7kNvwHiMZD1&_nc_oc=AdpEt_4wlYk_THOIPKSgbMnvDnfjw0_DRo_Po9AZxTsKGKaUMN0F2OASGzSV0gXAR0g&_nc_zt=23&_nc_ht=scontent.ftgu2-3.fna&_nc_gid=-k0VeS-1WVO13WpJV4Toug&_nc_ss=7b2a8&oh=00_Af5cCxyHuVrB3EfTLqZGaptlSI1M3zFl91upNkIbxwGmHA&oe=6A0A70E6",
    "gallery": "",
    "description": "Dedales gamer para celular, ideales para jugar con mejor deslizamiento, comodidad y precisión. Ayudan a reducir el sudor en pantalla y funcionan muy bien para Free Fire, PUBG Mobile, Call of Duty Mobile y otros juegos táctiles.",
    "promos": "1=25 | 2=50 | 3=69 | 4=92 | 5=110 | 6=132 | 7=154 | 8=168 | 9=189 | 10=200",
    "updatedAt": "2026-05-16T19:02:25",
    "active": true
  },
  {
    "id": "SDC-002",
    "name": "Dedales V2 - Fibra de Carbón",
    "categories": "Dedales",
    "brand": "SD Gamer",
    "price": 50,
    "cost": 0,
    "stock": 7,
    "colors": "General=7",
    "image": "https://scontent.ftgu2-3.fna.fbcdn.net/v/t45.5328-4/675990410_1784053375902397_1753047428843432918_n.jpg?stp=dst-jpg_p960x960_tt6&_nc_cat=111&ccb=1-7&_nc_sid=247b10&_nc_eui2=AeFDXUwUsFv6uowsNsLqXUeENuMvp3IV1ng24y-nchXWeHz_ou5j6ag2w4mYwF8l98aSeVsdPRsdiFHxSedJ15UR&_nc_ohc=uOpsxN0gFyEQ7kNvwHt2Qve&_nc_oc=AdqpJO8eLFTBL_VBSAOnB18ujrx9TUj_3j-i3jc5ZmKfF0aTfAVwnz4elDMUESEcvDA&_nc_zt=23&_nc_ht=scontent.ftgu2-3.fna&_nc_gid=vInxUpxQUIkv2-DNLHrJVQ&_nc_ss=7b2a8&oh=00_Af6gEbpnFmfoLjBZx1DVlYfz1JBOMR07N4lT6tfntXjU3w&oe=6A0A7827",
    "gallery": "",
    "description": "Dedales gamer versión V2 para celular, con tacto cómodo y buena respuesta en pantalla. Recomendados para quienes buscan más control, mejor deslizamiento y comodidad durante partidas largas.",
    "promos": "",
    "updatedAt": "2026-05-16T19:02:25",
    "active": true
  },
  {
    "id": "SDC-003",
    "name": "Dedales Gamer Pro Hilo de Plata para Celular",
    "categories": "Dedales",
    "brand": "SD Gamer",
    "price": 190,
    "cost": 0,
    "stock": 21,
    "colors": "General=21",
    "image": "https://scontent.ftgu2-2.fna.fbcdn.net/v/t45.5328-4/676558975_952421207407573_7762917873351242188_n.jpg?stp=dst-jpg_p960x960_tt6&_nc_cat=105&ccb=1-7&_nc_sid=247b10&_nc_eui2=AeHUurhOt6_ruwTnDgAB8n_IMJlDwxYEejAwmUPDFgR6MPyb1LQZ_aLoG2wsZx_xuZe0eohyYfbqxhaQ9HmqzufD&_nc_ohc=2w2NrsSRkRkQ7kNvwFwrYPp&_nc_oc=Adp4Zm40YYUHYe0G8tMDaiXhsvrGVnD1G8h7Td1FySu6WDwl0Cbd61bGPf6AWZf9NyQ&_nc_zt=23&_nc_ht=scontent.ftgu2-2.fna&_nc_gid=c6Kt5Y9_OhkKL3pvchCHmA&_nc_ss=7b2a8&oh=00_Af4uj-GQBPhm9QMTvmf6XAxUJraJZ5F-qUfoSvkAWZ2mDg&oe=6A0A5582",
    "gallery": "",
    "description": "Dedales Memo para gaming móvil, diseñados para mejorar la sensibilidad al tocar la pantalla y mantener un deslizamiento más estable. Ideales para jugadores de Free Fire, PUBG Mobile, COD Mobile y juegos similares.",
    "promos": "",
    "updatedAt": "2026-05-16T19:02:25",
    "active": true
  },
  {
    "id": "SDC-004",
    "name": "Gatillos Gamer Pro / Triggers Pro para celular",
    "categories": "Gamer Móvil",
    "brand": "SD Gamer",
    "price": 400,
    "cost": 190,
    "stock": 11,
    "colors": "General=11",
    "image": "https://scontent.ftgu2-2.fna.fbcdn.net/v/t45.5328-4/676041307_1622203069066456_833207036229297481_n.jpg?stp=dst-jpg_p960x960_tt6&_nc_cat=102&ccb=1-7&_nc_sid=247b10&_nc_eui2=AeF1LpcG2ri2R6BK98WklS8WLaI0EGwoyC0tojQQbCjILUIr3DzyFRM3mRk8YlU_bSjsiNU3ramv9chW3Cf55Ipx&_nc_ohc=Cb2mzCXckZ8Q7kNvwHEP7zt&_nc_oc=Adru-dCEC_4E8kwYkKCKYXTMZjJIgw1ecl_kBnoUg4ZeG2WW0KyiODbEUa75VkGhwCg&_nc_zt=23&_nc_ht=scontent.ftgu2-2.fna&_nc_gid=RKOfdOxrooSQ7vhF44VQIA&_nc_ss=7b2a8&oh=00_Af7VxgdYfpVbnuYlLG8QEfhuiyqXBJWIXJO4_MaWVfly4g&oe=6A0A596B",
    "gallery": "",
    "description": "Trigger gamer para celular, ideal para mejorar el control al apuntar, disparar y moverse en juegos móviles. Práctico para Free Fire, PUBG Mobile, Call of Duty Mobile y otros juegos de acción.",
    "promos": "",
    "updatedAt": "2026-05-16T19:02:25",
    "active": true
  },
  {
    "id": "SDC-005",
    "name": "Guantes Hilo de Plata – Marca Memo",
    "categories": "Gamer Móvil",
    "brand": "MEMO",
    "price": 360,
    "cost": 110,
    "stock": 2,
    "colors": "General=2",
    "image": "https://scontent.ftgu2-3.fna.fbcdn.net/v/t45.5328-4/637719085_1398829372273341_225217973062323190_n.jpg?stp=dst-jpg_p960x960_tt6&_nc_cat=110&ccb=1-7&_nc_sid=247b10&_nc_eui2=AeE9gd3kPhEkdJAC9XgvbjnHeDqMU5ENTnZ4OoxTkQ1Odr_M-p88iNJTFY-7PeR7rE2ALLvUW3qi5YVyv0C7paYs&_nc_ohc=je-Mu7QgeysQ7kNvwHVJIOq&_nc_oc=AdqQdhrhve497APQNHd9sO53E2GDKNzdUJ_JoFY8LCZW33drFr7IX_ctP5P9zk66sgM&_nc_zt=23&_nc_ht=scontent.ftgu2-3.fna&_nc_gid=grI71Kg-qVVjEtsb-N-isg&_nc_ss=7b2a8&oh=00_Af6Zu3ZMthkPxGJfSUNhHE3ovt15cOkj3zMFWW0gnlNhWA&oe=6A0A5395",
    "gallery": "",
    "description": "Guantes Memo para gaming móvil, pensados para mayor comodidad, mejor agarre y menos sudor al jugar. Ayudan a mantener un toque más limpio y preciso en la pantalla durante partidas largas.",
    "promos": "",
    "updatedAt": "2026-05-16T19:02:25",
    "active": true
  },
  {
    "id": "SDC-006",
    "name": "Enfriador X112",
    "categories": "Coolers",
    "brand": "X112",
    "price": 400,
    "cost": 250,
    "stock": 2,
    "colors": "General=2",
    "image": "https://scontent.ftgu2-2.fna.fbcdn.net/v/t39.84726-6/678969681_1863159007733174_8930140486556014096_n.jpg?stp=dst-jpg_s960x960_tt6&_nc_cat=103&ccb=1-7&_nc_sid=92e707&_nc_eui2=AeGxhI97-NJM92kUUWF1RwZ0awEZrbtLW5NrARmtu0tbk9DqMP09lIeReeCPoBA7JfEIZcbp4W5ahJX7az21i7tI&_nc_ohc=ovc6pnU9rwgQ7kNvwFfKyxV&_nc_oc=AdpRlWWanDrYmaiG89EucQY8q6AjOFO1ASdld4-gaPwUl3ZAXKoqSa5FzMpMYe_7f5M&_nc_zt=14&_nc_ht=scontent.ftgu2-2.fna&_nc_gid=7bJJa9204AqiiFdLg8sd4w&_nc_ss=7b2a8&oh=00_Af77IRQCxtgOu4A0iQdZ4zXKjI6gqOPlKBj9EGP0n00wUA&oe=69FD770A",
    "gallery": "",
    "description": "Enfriador para celular, ayuda a reducir la temperatura del equipo durante partidas largas, manteniendo un mejor rendimiento y mayor comodidad al jugar.",
    "promos": "",
    "updatedAt": "2026-05-16T19:02:25",
    "active": true
  },
  {
    "id": "SDC-007",
    "name": "Enfriador Memo CX15 PRO | Cooler Magnético para Celular",
    "categories": "Coolers",
    "brand": "MEMO",
    "price": 850,
    "cost": 0,
    "stock": 1,
    "colors": "General=1",
    "image": "https://scontent.ftgu2-3.fna.fbcdn.net/v/t45.5328-4/638624337_1682356099414339_1089494987278792494_n.jpg?stp=dst-jpg_p960x960_tt6&_nc_cat=109&ccb=1-7&_nc_sid=247b10&_nc_eui2=AeGCHo49oeVkT5mATzwQwmOihiNkvbqrevGGI2S9uqt68X08jBF1YRtrjFUOOWHD4375bZRZ5QmuRuD9c1hjdvPE&_nc_ohc=Yv4wPpVjDrEQ7kNvwGYkDBn&_nc_oc=Adrd3hAOLLoZ8_AdtuYi-Ya_MGE7QZNxBHBhAVZZ98Ba7Je__QUYhFfZdghGmFZcBDk&_nc_zt=23&_nc_ht=scontent.ftgu2-3.fna&_nc_gid=RvBtICTNRzJUzv07fUf6gg&_nc_ss=7b2a8&oh=00_Af7iNIx9gWgOJKjVx8wfDIf1qB_09NBJ3HKn3U1i8bUc3Q&oe=6A0A5B58",
    "gallery": "",
    "description": "Enfriador CX15 para celular, práctico para controlar el calentamiento del teléfono durante juegos o uso intenso. Ideal para mantener el dispositivo más fresco y estable.",
    "promos": "",
    "updatedAt": "2026-05-16T19:02:25",
    "active": true
  },
  {
    "id": "SDC-008",
    "name": "Audifonos QKZ",
    "categories": "Audio",
    "brand": "QKZ",
    "price": 120,
    "cost": 0,
    "stock": 2,
    "colors": "General=2",
    "image": "https://ae-pic-a1.aliexpress-media.com/kf/S53f972891bfe4e7a9b8676de6d1f06c46.jpg",
    "gallery": "",
    "description": "Audífonos QKZ con cable, ideales para escuchar música, jugar y realizar llamadas con sonido claro. Diseño cómodo para uso diario y buena experiencia de audio.",
    "promos": "",
    "updatedAt": "2026-05-16T19:02:25",
    "active": true
  },
  {
    "id": "SDC-009",
    "name": "Audifonos Tipo C",
    "categories": "Audio",
    "brand": "SD Audio",
    "price": 0,
    "cost": 0,
    "stock": 0,
    "colors": "General=0",
    "image": "Sin imagen",
    "gallery": "",
    "description": "Audífonos Tipo C para celulares con entrada USB-C, ideales para música, llamadas, videos y juegos. Una opción práctica para teléfonos que no tienen entrada auxiliar 3.5 mm.",
    "promos": "",
    "updatedAt": "2026-05-16T19:02:25",
    "active": true
  },
  {
    "id": "SDC-010",
    "name": "Adaptador MicroSD – USB 2.0",
    "categories": "Tecnología / Accesorios",
    "brand": "SD Tech",
    "price": 60,
    "cost": 0,
    "stock": 13,
    "colors": "Gris=7; Rosado=3; Negro=2; Dorado=1",
    "image": "https://scontent.ftgu2-3.fna.fbcdn.net/v/t45.5328-4/634981608_1053118134541037_9222488998596125420_n.jpg?stp=dst-jpg_p960x960_tt6&_nc_cat=110&ccb=1-7&_nc_sid=247b10&_nc_eui2=AeETQBWSBfmOKvGxARwcwUEhnsRjpSUlLnWexGOlJSUudawTVcEPDZhjy0j0nXG-EDRDt0wEfbzuCcc9Dbw47MfA&_nc_ohc=xQ69IIca9xoQ7kNvwFut4rW&_nc_oc=AdoELUWwsrCdMCwMzl1rGJQLUHQloCjahPe1yEnrqG_AKDTViRRt_0H3vYwjCM8h2J8&_nc_zt=23&_nc_ht=scontent.ftgu2-3.fna&_nc_gid=BnWVHmkwVP2Y9LoqJjliQg&_nc_ss=7b2a8&oh=00_Af4tjIlFM-Q-laJVIcbPTt4FXfZ1oalM82Z_wGwQEWIM6Q&oe=6A0A809E",
    "gallery": "",
    "description": "Adaptador para tarjeta MicroSD, útil para convertir una microSD a tamaño SD y facilitar la transferencia de fotos, videos, documentos y otros archivos en computadoras o lectores compatibles.",
    "promos": "",
    "updatedAt": "2026-05-16T12:19:48",
    "active": true
  },
  {
    "id": "SDC-011",
    "name": "Secador de Zapatos 2 en 1 (Seca y Quita el Mal Olor) – Temporizador hasta 120 min",
    "categories": "Hogar",
    "brand": "SD Hogar",
    "price": 350,
    "cost": 210,
    "stock": 5,
    "colors": "General=5",
    "image": "https://scontent.ftgu2-3.fna.fbcdn.net/v/t45.5328-4/636719338_1643166036822049_3869627812173568291_n.jpg?stp=dst-jpg_p960x960_tt6&_nc_cat=108&ccb=1-7&_nc_sid=247b10&_nc_eui2=AeETEynoebnaJmb-Y_PucfSCM110FEbMdD8zXXQURsx0P0cGPb7RFf9K-yKqb-_f6ZLlj77lAYG2URqWiOOKSjGb&_nc_ohc=WipkGZuVR9sQ7kNvwHjJYl6&_nc_oc=Adqh5kY0elv3OQpwmcjVNQicYwWq2sPAWXmH7d7NNp4CjZWMi2axYdFsIOizokilOdw&_nc_zt=23&_nc_ht=scontent.ftgu2-3.fna&_nc_gid=HH4GzomSDBoEvX41b9V94A&_nc_ss=7b2a8&oh=00_Af7ZoFsyFAVuRowILA3nhqBESPsdQr6ri0yNaxE9RAKaqA&oe=6A0A6C43",
    "gallery": "",
    "description": "Secador de zapatos práctico para ayudar a eliminar humedad del calzado después de lluvia, lavado o uso diario. Ideal para mantener los zapatos más secos, cómodos y con mejor olor.",
    "promos": "",
    "updatedAt": "2026-05-16T19:02:25",
    "active": true
  },
  {
    "id": "SDC-012",
    "name": "Termo Stanley Rosado",
    "categories": "Termos / Hogar",
    "brand": "Stanley",
    "price": 0,
    "cost": 0,
    "stock": 0,
    "colors": "General=0",
    "image": "Sin imagen",
    "gallery": "",
    "description": "Termo estilo Stanley color rosado, ideal para llevar bebidas frías o calientes por más tiempo. Diseño moderno, práctico y bonito para uso diario, trabajo, estudio, viajes o gimnasio.",
    "promos": "",
    "updatedAt": "2026-05-16T19:02:25",
    "active": true
  },
  {
    "id": "SDC-013",
    "name": "Enfriador PRO para Celular – Juega sin LAG, sin Calor",
    "categories": "Coolers",
    "brand": "SD Gamer",
    "price": 360,
    "cost": 0,
    "stock": 1,
    "colors": "General=1",
    "image": "https://scontent.ftgu2-2.fna.fbcdn.net/v/t45.5328-4/638513478_1563676451590509_6639373606200504306_n.jpg?_nc_cat=105&ccb=1-7&_nc_sid=247b10&_nc_eui2=AeHUf81uFW6nZmKYq62Bb9UUqRJelXmrVr2pEl6VeatWve4NbiTG-8y-zy4Gud95_yeEjUaflkR1xvQtp9no4YSZ&_nc_ohc=uIZSdvchW18Q7kNvwFJZhqW&_nc_oc=AdomO11haIHoSFuATT_I3hv2bDnZThxy4kh_5e0RzdGTm-ze7WeJ7rt8Ont1QpTNGRU&_nc_zt=23&_nc_ht=scontent.ftgu2-2.fna&_nc_gid=6FWHXLYLk3xfIJoLHpZOZg&_nc_ss=7b2a8&oh=00_Af7Ns3AVRKqBYrNPq_bMphGgFja08M_nUHBTZEZdkHThag&oe=6A0A6DDF",
    "gallery": "",
    "description": "Enfriador PRO para celular, ideal para ayudar a controlar el calentamiento durante juegos, transmisiones o uso intenso. Recomendado para mantener el equipo más fresco y cómodo en partidas largas.",
    "promos": "",
    "updatedAt": "2026-05-16T19:02:25",
    "active": true
  },
  {
    "id": "SDC-014",
    "name": "Enfriador o Cooler Gamer para Celular",
    "categories": "Coolers",
    "brand": "SD Gamer",
    "price": 150,
    "cost": 0,
    "stock": 1,
    "colors": "General=1",
    "image": "https://scontent.ftgu2-3.fna.fbcdn.net/v/t45.5328-4/638090475_1202289095220777_1624465346820150004_n.jpg?stp=dst-jpg_p960x960_tt6&_nc_cat=106&ccb=1-7&_nc_sid=247b10&_nc_eui2=AeE4MT4Gcm1fmoFGwTE9g1YmAlyfAwTJqPACXJ8DBMmo8OlhOM_ctagH_Ssw4NrNKsABgAIjIaKVDs4VhHoTEwKJ&_nc_ohc=OgqegbVAMrYQ7kNvwFy6fco&_nc_oc=AdoHnV0tDW_fYZbrxHkH0vfKAsoi6rWkW-F6KeQXYb2XLOxatSHO9Z0RqZoZQ0alaAo&_nc_zt=23&_nc_ht=scontent.ftgu2-3.fna&_nc_gid=sq8_IpBXBtvzNoCWty083g&_nc_ss=7b2a8&oh=00_Af7kJnOoHH0ux_M-p1BTWozJVIItya_eNOMGS3v2Dscn0w&oe=6A0A5772",
    "gallery": "",
    "description": "Cooler gamer para celular, práctico para reducir la temperatura del teléfono mientras jugás. Ayuda a mantener un mejor rendimiento y mayor comodidad durante sesiones prolongadas.",
    "promos": "",
    "updatedAt": "2026-05-16T19:02:25",
    "active": true
  },
  {
    "id": "SDC-015",
    "name": "Dedales SARAFOX - Hilo de Plata",
    "categories": "Dedales",
    "brand": "Sarafox",
    "price": 400,
    "cost": 0,
    "stock": 0,
    "colors": "General=0",
    "image": "https://scontent.ftgu2-2.fna.fbcdn.net/v/t45.5328-4/628688109_934043255731923_5064943601078365488_n.jpg?stp=dst-jpg_p960x960_tt6&_nc_cat=102&ccb=1-7&_nc_sid=247b10&_nc_eui2=AeGFniKC-UvyuJzMIgxdAmy-XgwT4W75WvdeDBPhbvla98EmE1YfrD1ry8adLrMoJVVUNJI0RDqHlRnqqimmmYmO&_nc_ohc=4Sc0rFKN98YQ7kNvwEnnhZZ&_nc_oc=Adr4h1XgU-CP39KCe7-C9BgG9_I9nyX73kv-FhOLVN4YTbIq9iSPsAfzeBbVd4ctZWo&_nc_zt=23&_nc_ht=scontent.ftgu2-2.fna&_nc_gid=exXaTAq4BP_VPQDQ4JHFGQ&_nc_ss=7b2a8&oh=00_Af7XRuQjsFVY5gBC8Ze1Fetdio2EICmSmm-vtr-i9Ek5vw&oe=6A0A693C",
    "gallery": "",
    "description": "Dedales SARAFOX con hilo de plata para gaming móvil, diseñados para brindar mejor sensibilidad, deslizamiento y precisión en pantalla. Ideales para Free Fire, PUBG Mobile, COD Mobile y juegos táctiles.",
    "promos": "",
    "updatedAt": "2026-05-16T19:02:25",
    "active": true
  },
  {
    "id": "SDC-016",
    "name": "Gamepad con Cooler para Celular | Android & iOS",
    "categories": "Controles / Gamepad",
    "brand": "SD Gamer",
    "price": 490,
    "cost": 0,
    "stock": 1,
    "colors": "General=1",
    "image": "https://scontent.ftgu2-3.fna.fbcdn.net/v/t45.5328-4/639027101_916011954460111_6170524688724565431_n.jpg?stp=dst-jpg_p960x960_tt6&_nc_cat=108&ccb=1-7&_nc_sid=247b10&_nc_eui2=AeGjnOquKGyGfKM1fkp93akc9FV3lm-avC30VXeWb5q8LdZi61FfEBZnSVAOq3kZFXGiwrds4PJA7jSHo62laf7h&_nc_ohc=qgt0QpMSt6kQ7kNvwGm9eG7&_nc_oc=AdqJOA06ptoX8eZMxX5kdkIHj9gPKAknFj8htgR0uBYVnSGxpIu7ZbSYQl60tEKlqKc&_nc_zt=23&_nc_ht=scontent.ftgu2-3.fna&_nc_gid=8uAnvzt7UFWbV4Ng3K0cLw&_nc_ss=7b2a8&oh=00_Af6OaLQ6-gRFJMlMSApiYrcN9UzllA-F93hXuX0176muJw&oe=6A0A58CF",
    "gallery": "",
    "description": "Gamepad con cooler para celular, compatible con Android y iOS según el equipo. Combina mejor agarre, controles físicos y enfriamiento para jugar con más comodidad.",
    "promos": "",
    "updatedAt": "2026-05-16T19:02:25",
    "active": true
  },
  {
    "id": "SDC-017",
    "name": "Gamepad MEMO para Celular 4 Gatillos Personalizables Android & iOS",
    "categories": "Controles / Gamepad",
    "brand": "MEMO",
    "price": 400,
    "cost": 0,
    "stock": 1,
    "colors": "General=1",
    "image": "https://scontent.ftgu2-2.fna.fbcdn.net/v/t45.5328-4/640328536_1738858970812086_1196949487915039456_n.jpg?stp=dst-jpg_p960x960_tt6&_nc_cat=107&ccb=1-7&_nc_sid=247b10&_nc_eui2=AeFs0KbnTmwuWhcXN0ToD0Yn_NcKzHEfe7r81wrMcR97uhV-ZtEdpqWqxllvgejEz-8LPcEsfmctPm2ZkxDqow5q&_nc_ohc=3tiptgNIv-wQ7kNvwHQtybP&_nc_oc=AdpNRYdRyfWmXe1A2HUB0tao_C9lK7yhxaBI6kOVrvPBEc6WmNc4JDj7Wca3IhobWas&_nc_zt=23&_nc_ht=scontent.ftgu2-2.fna&_nc_gid=sxqp0oCJQiV_cAKr3KnSLA&_nc_ss=7b2a8&oh=00_Af5ekD5Ko6e3wXiE7-IX-yzm-EtpAuDU-hJdrxm9hgiG0w&oe=6A0A6A54",
    "gallery": "",
    "description": "Gamepad MEMO para celular con 4 gatillos personalizables, pensado para juegos de acción y disparos. Brinda mejor control, agarre firme y una experiencia más cómoda en Android y iOS.",
    "promos": "",
    "updatedAt": "2026-05-16T19:02:25",
    "active": true
  },
  {
    "id": "SDC-018",
    "name": "GAMEPAD CON COOLER Y JOYSTICK",
    "categories": "Controles / Gamepad",
    "brand": "SD Gamer",
    "price": 300,
    "cost": 0,
    "stock": 1,
    "colors": "General=1",
    "image": "https://scontent.ftgu2-3.fna.fbcdn.net/v/t45.5328-4/641512992_1602162270997657_4897317482266424208_n.jpg?stp=dst-jpg_p960x960_tt6&_nc_cat=109&ccb=1-7&_nc_sid=247b10&_nc_eui2=AeFvLDZG1uRKpyBDIke1WQfBixPRFPzj1mGLE9EU_OPWYQ6XyK_nfTkBtkVLRCDCokmSeUy7IDZbN9n1Z6up4mVl&_nc_ohc=yi3eqRzdyWIQ7kNvwGvWzmG&_nc_oc=Ado1d0fNBgNXeY8bwk79fbql8EhdJW2TAouZdc1Kzw0Jhd69DUU-PmPasJm8qBi-JvA&_nc_zt=23&_nc_ht=scontent.ftgu2-3.fna&_nc_gid=FLd8AhtV3BUyOQi8qlgvMw&_nc_ss=7b2a8&oh=00_Af7YtsMH_6XAilgWsI1xi4LSrd3PSblpulI7_4wFSweAOg&oe=6A0A7B76",
    "gallery": "",
    "description": "Gamepad con cooler y joystick para celular, ideal para quienes buscan mejor control y comodidad al jugar. Su diseño ayuda a sujetar mejor el teléfono y mantenerlo más fresco.",
    "promos": "",
    "updatedAt": "2026-05-16T19:02:25",
    "active": true
  },
  {
    "id": "SDC-019",
    "name": "Control PRO Inalámbrico Bluetooth Android / iOS / PC / Switch Turbo + Macro",
    "categories": "Controles / Gamepad",
    "brand": "SD Gamer",
    "price": 490,
    "cost": 0,
    "stock": 1,
    "colors": "General=1",
    "image": "https://scontent.ftgu2-3.fna.fbcdn.net/v/t45.5328-4/642266149_1957713028176415_4164663008594583667_n.jpg?stp=dst-jpg_p960x960_tt6&_nc_cat=109&ccb=1-7&_nc_sid=247b10&_nc_eui2=AeEmUpvtDoHe1R7OfAlvuSojisnEIqovsJSKycQiqi-wlPzrx0qaF0mWN8SBc7t00qnAqaola8gtbd8BfC7gDx4M&_nc_ohc=A8r8i9u2FegQ7kNvwEw5JYK&_nc_oc=AdqmO3YOJVquIrbj3PZmdSNK_Eo2j8IUtkWF7r-ybWIWVrlBJh7Clrv7Sv1_ivsNIps&_nc_zt=23&_nc_ht=scontent.ftgu2-3.fna&_nc_gid=RwmAoqfY_jwDEWf_AW_nfg&_nc_ss=7b2a8&oh=00_Af7KyuJNvRRjB1MMXVoKqhIbioqYfkExk-62ErCRIXrFjQ&oe=6A0A5DDD",
    "gallery": "",
    "description": "Control PRO inalámbrico Bluetooth para Android, iOS, PC y Nintendo Switch. Incluye funciones Turbo y Macro para una experiencia más completa en juegos compatibles.",
    "promos": "",
    "updatedAt": "2026-05-16T19:02:25",
    "active": true
  },
  {
    "id": "SDC-020",
    "name": "Control Gamer con Soporte para Celular",
    "categories": "Controles / Gamepad",
    "brand": "SD Gamer",
    "price": 420,
    "cost": 0,
    "stock": 1,
    "colors": "General=1",
    "image": "https://scontent.ftgu2-2.fna.fbcdn.net/v/t45.5328-4/641092147_3338186259680187_3998331395686310384_n.jpg?_nc_cat=101&ccb=1-7&_nc_sid=247b10&_nc_eui2=AeGafZW4fyKzOwIGV0R6D_KwPiuInzeTAIs-K4ifN5MAi5wSM49CqU8tfZFVEeeh4sPUi9tvGE4Gn-zgxu0v9A82&_nc_ohc=UNhwGgQT3zgQ7kNvwG2qedm&_nc_oc=Adqs6YRhUqDod6mrhwjgXDT6v_FUbNfa6oLYlowBuCYZhXdg8VvyPLGSogRwRSYQa0g&_nc_zt=23&_nc_ht=scontent.ftgu2-2.fna&_nc_gid=Ym1y5Z-CdchqZkhZ7tZ9zQ&_nc_ss=7b2a8&oh=00_Af7Gi8G5p9J7wFU5UurFGmNed4-BS_jt7u7B1qlfGhY7Pg&oe=6A0A5EA8",
    "gallery": "",
    "description": "Control gamer con soporte para celular, ideal para jugar con mejor agarre y mayor precisión. Su soporte permite colocar el teléfono de forma cómoda para partidas largas.",
    "promos": "",
    "updatedAt": "2026-05-16T19:02:25",
    "active": true
  },
  {
    "id": "SDC-021",
    "name": "Mousepad Xtech Rosa con Soporte de Muñeca 23×18cm",
    "categories": "Mousepad",
    "brand": "Xtech",
    "price": 150,
    "cost": 0,
    "stock": 1,
    "colors": "General=1",
    "image": "Sin imagen",
    "gallery": "",
    "description": "Mousepad Xtech color rosa con soporte de muñeca, tamaño 23×18 cm. Brinda una superficie cómoda para el mouse y ayuda a descansar la muñeca durante estudio, oficina o gaming casual.",
    "promos": "",
    "updatedAt": "2026-05-16T19:02:25",
    "active": true
  },
  {
    "id": "SDC-022",
    "name": "Tira de Esponja para Puertas y Ventanas 70cm Anti Polvo e Insectos",
    "categories": "Hogar",
    "brand": "SD Hogar",
    "price": 80,
    "cost": 0,
    "stock": 1,
    "colors": "General=1",
    "image": "Sin imagen",
    "gallery": "",
    "description": "Tira de esponja para puertas y ventanas de 70 cm, útil para ayudar a bloquear polvo, insectos y corrientes de aire. Ideal para mejorar el sellado de espacios en el hogar.",
    "promos": "",
    "updatedAt": "2026-05-16T19:02:25",
    "active": true
  },
  {
    "id": "SDC-023",
    "name": "Fuente de Agua para Gato o Perro 3L USB + Filtro",
    "categories": "Mascotas",
    "brand": "SD Mascotas",
    "price": 270,
    "cost": 0,
    "stock": 1,
    "colors": "General=1",
    "image": "Sin imagen",
    "gallery": "",
    "description": "Fuente de agua para gato o perro de 3 litros con conexión USB y filtro. Mantiene el agua en movimiento para incentivar a las mascotas a beber con mayor frecuencia.",
    "promos": "",
    "updatedAt": "2026-05-16T19:02:25",
    "active": true
  },
  {
    "id": "SDC-024",
    "name": "Funda Protectora para Refrigeradora / Lavadora (Anti Polvo) + Bolsillos",
    "categories": "Hogar",
    "brand": "SD Hogar",
    "price": 150,
    "cost": 0,
    "stock": 1,
    "colors": "General=1",
    "image": "Sin imagen",
    "gallery": "",
    "description": "Funda protectora para refrigeradora o lavadora, ideal para ayudar a proteger contra polvo y salpicaduras. Incluye bolsillos laterales para guardar artículos pequeños del hogar.",
    "promos": "",
    "updatedAt": "2026-05-16T19:02:25",
    "active": true
  },
  {
    "id": "SDC-025",
    "name": "Funda para Moto Impermeable Metalizada 140×240cm (Protección Sol/Lluvia/Polvo)",
    "categories": "Hogar / Automotriz",
    "brand": "SD Hogar",
    "price": 200,
    "cost": 0,
    "stock": 0,
    "colors": "General=0",
    "image": "Sin imagen",
    "gallery": "",
    "description": "Funda para moto impermeable metalizada de 140×240 cm, diseñada para proteger contra sol, lluvia y polvo. Práctica para cuidar la motocicleta cuando permanece estacionada.",
    "promos": "",
    "updatedAt": "2026-05-16T19:02:25",
    "active": true
  },
  {
    "id": "SDC-026",
    "name": "Juego de Destornilladores de Precisión 115 en 1 (PC y Celular)",
    "categories": "Herramientas",
    "brand": "SD Herramientas",
    "price": 300,
    "cost": 0,
    "stock": 1,
    "colors": "General=1",
    "image": "Sin imagen",
    "gallery": "",
    "description": "Juego de destornilladores de precisión 115 en 1, ideal para reparación de celulares, computadoras, laptops, consolas y electrónicos pequeños. Incluye puntas variadas para diferentes trabajos.",
    "promos": "",
    "updatedAt": "2026-05-16T19:02:25",
    "active": true
  },
  {
    "id": "SDC-027",
    "name": "Cosmetiquera con Espejo LED | 3 tipos de luz (Natural/Fría/Cálida)",
    "categories": "Belleza",
    "brand": "SD Belleza",
    "price": 290,
    "cost": 0,
    "stock": 1,
    "colors": "General=1",
    "image": "Sin imagen",
    "gallery": "",
    "description": "Cosmetiquera con espejo LED y 3 tipos de luz: natural, fría y cálida. Perfecta para organizar maquillaje y retocarse con mejor iluminación en casa o de viaje.",
    "promos": "",
    "updatedAt": "2026-05-16T19:02:25",
    "active": true
  },
  {
    "id": "SDC-028",
    "name": "Afilador de Cuchillos – 3 Niveles",
    "categories": "Cocina / Hogar",
    "brand": "SD Hogar",
    "price": 100,
    "cost": 0,
    "stock": 1,
    "colors": "General=1",
    "image": "Sin imagen",
    "gallery": "",
    "description": "Afilador de cuchillos de 3 niveles, práctico para recuperar y mantener el filo de cuchillos de cocina. Compacto, fácil de usar y útil para el hogar.",
    "promos": "",
    "updatedAt": "2026-05-16T19:02:25",
    "active": true
  },
  {
    "id": "SDC-029",
    "name": "Mouse Gamer X12 – 3200DPI",
    "categories": "Mouse / Tecnología",
    "brand": "SD Tech",
    "price": 300,
    "cost": 0,
    "stock": 1,
    "colors": "General=1",
    "image": "Sin imagen",
    "gallery": "",
    "description": "Mouse gamer X12 de 3200 DPI, ideal para juegos, estudio y uso diario en computadora. Diseño cómodo con buen agarre para movimientos más precisos.",
    "promos": "",
    "updatedAt": "2026-05-16T19:02:25",
    "active": true
  },
  {
    "id": "SDC-030",
    "name": "Memoria USB 3.2 – 256GB",
    "categories": "Memorias USB",
    "brand": "MEMO",
    "price": 1050,
    "cost": 0,
    "stock": 1,
    "colors": "General=1",
    "image": "Sin imagen",
    "gallery": "",
    "description": "Memoria USB 3.2 de 256GB, ideal para guardar fotos, videos, documentos, música y respaldos importantes. Portátil, práctica y fácil de usar en computadoras compatibles.",
    "promos": "",
    "updatedAt": "2026-05-16T19:02:25",
    "active": true
  },
  {
    "id": "SDC-031",
    "name": "Memoria USB 3.2 – 128GB",
    "categories": "Memorias USB",
    "brand": "MEMO",
    "price": 620,
    "cost": 0,
    "stock": 1,
    "colors": "General=1",
    "image": "Sin imagen",
    "gallery": "",
    "description": "Memoria USB 3.2 de 128GB, excelente para transportar archivos, tareas, fotos y videos. Una opción práctica para estudio, trabajo y respaldo de información.",
    "promos": "",
    "updatedAt": "2026-05-16T19:02:25",
    "active": true
  },
  {
    "id": "SDC-032",
    "name": "Memoria USB 3.2 – 64GB",
    "categories": "Memorias USB",
    "brand": "MEMO",
    "price": 320,
    "cost": 0,
    "stock": 1,
    "colors": "General=1",
    "image": "Sin imagen",
    "gallery": "",
    "description": "Memoria USB 3.2 de 64GB, compacta y útil para guardar documentos, música, fotos y archivos de uso diario. Ideal para estudiantes, oficina y respaldo rápido.",
    "promos": "",
    "updatedAt": "2026-05-16T19:02:25",
    "active": true
  },
  {
    "id": "SDC-033",
    "name": "Memoria USB 3.2 – 32GB",
    "categories": "Memorias USB",
    "brand": "MEMO",
    "price": 240,
    "cost": 0,
    "stock": 1,
    "colors": "General=1",
    "image": "Sin imagen",
    "gallery": "",
    "description": "Memoria USB 3.2 de 32GB, práctica para transferir y guardar documentos, tareas, fotos y archivos pequeños. Fácil de llevar y usar en computadoras compatibles.",
    "promos": "",
    "updatedAt": "2026-05-16T19:02:25",
    "active": true
  },
  {
    "id": "SDC-034",
    "name": "Memoria USB - 16GB",
    "categories": "Memorias USB",
    "brand": "MEMO",
    "price": 190,
    "cost": 0,
    "stock": 1,
    "colors": "General=1",
    "image": "Sin imagen",
    "gallery": "",
    "description": "Memoria USB de 16GB, ideal para guardar documentos, tareas, música y archivos personales. Una opción económica y práctica para uso diario.",
    "promos": "",
    "updatedAt": "2026-05-16T19:02:25",
    "active": true
  },
  {
    "id": "SDC-035",
    "name": "Memoria MicroSD 256GB – V30 / U3 / A1",
    "categories": "Memorias MicroSD",
    "brand": "MEMO",
    "price": 1350,
    "cost": 0,
    "stock": 1,
    "colors": "General=1",
    "image": "Sin imagen",
    "gallery": "",
    "description": "Memoria MicroSD 256GB V30 / U3 / A1, recomendada para celulares, cámaras y dispositivos compatibles. Ideal para ampliar almacenamiento y guardar fotos, videos y aplicaciones.",
    "promos": "",
    "updatedAt": "2026-05-16T19:02:25",
    "active": true
  },
  {
    "id": "SDC-036",
    "name": "Maxell MicroSD 128GB – Alta Velocidad",
    "categories": "Memorias MicroSD",
    "brand": "Maxell",
    "price": 920,
    "cost": 0,
    "stock": 1,
    "colors": "General=1",
    "image": "Sin imagen",
    "gallery": "",
    "description": "Memoria Maxell MicroSD 128GB de alta velocidad, ideal para ampliar almacenamiento en celulares, cámaras y otros equipos compatibles. Perfecta para fotos, videos y archivos.",
    "promos": "",
    "updatedAt": "2026-05-16T19:02:25",
    "active": true
  },
  {
    "id": "SDC-037",
    "name": "Maxell MicroSD 64GB – Clase 10",
    "categories": "Memorias MicroSD",
    "brand": "Maxell",
    "price": 450,
    "cost": 0,
    "stock": 1,
    "colors": "General=1",
    "image": "Sin imagen",
    "gallery": "",
    "description": "Memoria Maxell MicroSD 64GB Clase 10, práctica para celulares, cámaras y dispositivos compatibles. Buena opción para guardar fotos, música, videos y documentos.",
    "promos": "",
    "updatedAt": "2026-05-16T19:02:25",
    "active": true
  },
  {
    "id": "SDC-038",
    "name": "Maxell MicroSD 32GB – Clase 10",
    "categories": "Memorias MicroSD",
    "brand": "Maxell",
    "price": 290,
    "cost": 0,
    "stock": 1,
    "colors": "General=1",
    "image": "Sin imagen",
    "gallery": "",
    "description": "Memoria Maxell MicroSD 32GB Clase 10, ideal para ampliar almacenamiento en equipos compatibles. Útil para fotos, música, documentos y archivos de uso diario.",
    "promos": "",
    "updatedAt": "2026-05-16T19:02:25",
    "active": true
  },
  {
    "id": "SDC-039",
    "name": "Maxell MicroSD 16GB – Clase 10",
    "categories": "Memorias MicroSD",
    "brand": "Maxell",
    "price": 230,
    "cost": 0,
    "stock": 1,
    "colors": "General=1",
    "image": "Sin imagen",
    "gallery": "",
    "description": "Memoria Maxell MicroSD 16GB Clase 10, opción práctica para guardar archivos básicos, música, fotos y documentos en celulares o dispositivos compatibles.",
    "promos": "",
    "updatedAt": "2026-05-16T19:02:25",
    "active": true
  },
  {
    "id": "SDC-040",
    "name": "Ubicación Tienda SD-COMAYAGUA (Piedras Bonitas) | WhatsApp 3151-7755",
    "categories": "Tienda / Información",
    "brand": "SD COMAYAGUA",
    "price": 0,
    "cost": 0,
    "stock": 1,
    "colors": "General=1",
    "image": "https://scontent.ftgu2-2.fna.fbcdn.net/v/t45.5328-4/598893491_1788202175206187_5679804949134251976_n.jpg?stp=dst-jpg_p960x960_tt6&_nc_cat=100&ccb=1-7&_nc_sid=247b10&_nc_eui2=AeHgXW_51aUwSIdlveqoEe2UM8Fly9-sikszwWXL36yKSy6LUNKC_vYZreBxHHrtlMckkuF-ByvmBoNyOStTy5Zy&_nc_ohc=wpfHvWic07UQ7kNvwE0yEhH&_nc_oc=AdrMV7Ee5grf6iJk9FoMThdaDBid7FyTOHruDcJO8hk_NJozNC2CHB1u7lLpXIj0b60&_nc_zt=23&_nc_ht=scontent.ftgu2-2.fna&_nc_gid=gyFEt8WEVWNmPW1q2bkVWw&_nc_ss=7b2a8&oh=00_Af7XZIGgnBzsYfLB8wLKDCRfMFlo-bxcePPoSZdXRNFw2g&oe=6A0A7FDA",
    "gallery": "",
    "description": "Publicación informativa con la ubicación de SD-COMAYAGUA en Piedras Bonitas y contacto por WhatsApp 3151-7755. Sirve para orientar al cliente y facilitar la visita a la tienda.",
    "promos": "",
    "updatedAt": "2026-05-16T19:02:25",
    "active": true
  },
  {
    "id": "SDC-041",
    "name": "Pastillas de limpieza efervescentes para lavadoras",
    "categories": "Lavadora",
    "brand": "SD Hogar",
    "price": 90,
    "cost": 11,
    "stock": 8,
    "colors": "General=8",
    "image": "Sin imagen",
    "gallery": "",
    "description": "Producto disponible en SD COMAYAGUA. Ideal para clientes que buscan buena calidad, precio claro y atención por WhatsApp. Categoría: Producto. Disponible para cotización, venta y envío según zona.",
    "promos": "",
    "updatedAt": "2026-05-16T19:02:25",
    "active": true
  },
  {
    "id": "SDC-042",
    "name": "Cable Tipo V8 2M",
    "categories": "Cable V8",
    "brand": "SD Tech",
    "price": 60,
    "cost": 33,
    "stock": 2,
    "colors": "General=2",
    "image": "Sin imagen",
    "gallery": "",
    "description": "Producto disponible en SD COMAYAGUA. Ideal para clientes que buscan buena calidad, precio claro y atención por WhatsApp. Categoría: Producto. Disponible para cotización, venta y envío según zona.",
    "promos": "",
    "updatedAt": "2026-05-16T19:02:25",
    "active": true
  },
  {
    "id": "SDC-043",
    "name": "Picador de Verduras",
    "categories": "Cocina",
    "brand": "SD Hogar",
    "price": 110,
    "cost": 57,
    "stock": 3,
    "colors": "General=3",
    "image": "Sin imagen",
    "gallery": "",
    "description": "Producto disponible en SD COMAYAGUA. Ideal para clientes que buscan buena calidad, precio claro y atención por WhatsApp. Categoría: Producto. Disponible para cotización, venta y envío según zona.",
    "promos": "",
    "updatedAt": "2026-05-16T19:02:25",
    "active": true
  },
  {
    "id": "SDC-046",
    "name": "Pulidor de Faro para Carro",
    "categories": "Automotriz",
    "brand": "SD Auto",
    "price": 110,
    "cost": 50,
    "stock": 3,
    "colors": "General=3",
    "image": "Sin imagen",
    "gallery": "",
    "description": "Producto disponible en SD COMAYAGUA. Ideal para clientes que buscan buena calidad, precio claro y atención por WhatsApp. Categoría: Producto. Disponible para cotización, venta y envío según zona.",
    "promos": "",
    "updatedAt": "2026-05-16T19:02:25",
    "active": true
  },
  {
    "id": "SDC-047",
    "name": "Adaptador MicroSD Gris",
    "categories": "Adaptador MicroSD",
    "brand": "SD Tech",
    "price": 50,
    "cost": 11,
    "stock": 13,
    "colors": "General=13",
    "image": "Sin imagen",
    "gallery": "",
    "description": "Producto disponible en SD COMAYAGUA. Ideal para clientes que buscan buena calidad, precio claro y atención por WhatsApp. Categoría: Producto. Disponible para cotización, venta y envío según zona.",
    "promos": "",
    "updatedAt": "2026-05-16T04:35:56",
    "active": true
  }
];

window.SDC_PLACEHOLDERS = {
  gamer:'assets/placeholders/gamer.svg',
  tecnología:'assets/placeholders/tecnologia.svg',
  tecnologia:'assets/placeholders/tecnologia.svg',
  hogar:'assets/placeholders/hogar.svg',
  cocina:'assets/placeholders/hogar.svg',
  default:'assets/placeholders/no-image.svg'
};


;/* ==== js/storage.js ==== */

(function(){
  const KEY = 'sdc_control_ventas_v90';
  const BACKUP_KEY = 'sdc_backups_v90';
  const LEGACY_BACKUP_KEYS = ['sdcBackups_v90','sdcBackups_v89','sdc_backups_v89'];
  function safeJSON(raw,fallback){try{return JSON.parse(raw)}catch(e){return fallback}}
  function uid(prefix='SDC'){return `${prefix}-${Date.now().toString().slice(-7)}${Math.floor(Math.random()*90+10)}`}
  function clone(x){return JSON.parse(JSON.stringify(x))}
  function textField(v,fallback=''){
    if(Array.isArray(v)) return v.map(x=>String(x||'').trim()).filter(Boolean).join(', ') || fallback;
    if(v && typeof v==='object') return Object.values(v).map(x=>String(x||'').trim()).filter(Boolean).join(', ') || fallback;
    return String(v ?? fallback);
  }
  function defaultState(){return {version:93,unlocked:false,products:clone(window.SDC_DEFAULT_PRODUCTS||[]),sales:[],quotes:[],clients:[],closings:[],expenses:[],lastReceipt:null,lastQuote:null,settings:clone(window.SDC_CONFIG||{})}}
  function normalizeColorRows(v){
    const cleanRow=(name,qty)=>{
      const n=String(name||'').trim();
      const q=Math.max(0,Math.floor(Number(String(qty??'').replace(/[^0-9.-]/g,''))||0));
      return n?{name:n,qty:q}:null;
    };
    if(Array.isArray(v)) return v.map(x=>{
      if(typeof x==='string'){
        const m=x.match(/^(.+?)(?:[:=]|\s+x\s+|\s+-\s+)\s*([0-9]+(?:[.,][0-9]+)?)$/i);
        return m?cleanRow(m[1],m[2]):cleanRow(x,0);
      }
      return cleanRow(x?.name||x?.color||x?.colour||x?.nombre||x?.label, x?.qty??x?.cantidad??x?.stock??x?.existencia);
    }).filter(Boolean);
    if(v && typeof v==='object') return Object.entries(v).map(([name,qty])=>cleanRow(name,qty)).filter(Boolean);
    const raw=String(v||'').trim();
    if(!raw) return [];
    try{ const parsed=JSON.parse(raw); if(parsed && parsed!==raw) return normalizeColorRows(parsed); }catch(e){}
    return raw.split(/\s*(?:\r?\n|\||;|,)\s*/).map(part=>{
      const txt=String(part||'').trim();
      if(!txt) return null;
      let m=txt.match(/^(.+?)(?:[:=]|\s+x\s+|\s+-\s+)\s*([0-9]+(?:[.,][0-9]+)?)$/i);
      if(!m) m=txt.match(/^([0-9]+(?:[.,][0-9]+)?)\s+(.+)$/);
      return m?(m[2]&&/^\d/.test(m[1])?cleanRow(m[2],m[1]):cleanRow(m[1],m[2])):cleanRow(txt,0);
    }).filter(Boolean);
  }
  function colorRowsTotal(rows){return normalizeColorRows(rows).reduce((a,r)=>a+(Number(r.qty)||0),0)}
  function normalizeProduct(p,i=0){
    const categories = p.categories || p.category || p.categoria || p.etiquetas || 'General';
    const image = p.image || p.imagen || p.imagenes || p.foto || p.fotos || (Array.isArray(p.images)&&p.images[0]) || '';
    const gallery = p.gallery || p.galeria || p.imagenes_extra || p.fotos_extra || p.images || '';
    const colors = normalizeColorRows(p.colors || p.colores || p.colorStock || p.stockColores || p.variantesColor || p.variantes_color || '');
    const rawStock = Number(p.stock??p.existencia??0)||0;
    const colorStock = colorRowsTotal(colors);
    return {
      id:textField(p.id||p.codigo||`SDC-${String(i+1).padStart(3,'0')}`),
      name:textField(p.name||p.nombre||'Producto sin nombre','Producto sin nombre'),
      categories:textField(categories,'General').replace(/^\[object Object\]$/i,'General'),
      price:Number(p.price??p.precio??p.precio_venta??0)||0,
      cost:Number(p.cost??p.costo??p.costo_compra??0)||0,
      stock:colors.length?colorStock:rawStock,
      colors,
      brand:textField(p.brand||p.marca||''),
      image:textField(image,''),
      gallery:Array.isArray(gallery)?gallery.map(x=>textField(x,'')).filter(Boolean).join('\n'):textField(gallery,''),
      description:textField(p.description||p.descripcion||''),
      promos:textField(p.promos||p.promociones||p.preciosCantidad||p.precios_cantidad||p.mayoreo||p.ofertas||''),
      active:!(p.active===false || p.activo===false || String(p.active??p.activo??'1').trim()==='0'),
      updatedAt:textField(p.updatedAt||p.updated_at||p.fecha_actualizacion||'')
    }
  }
  function hasRealProduct(p){if(!p)return false;const name=String(p.name||'').trim();const placeholder=/^producto\s+sin\s+nombre$/i.test(name);const price=Number(p.price||0);const stock=Number(p.stock||0);const img=String(p.image||'').trim();const id=String(p.id||'').trim();if(placeholder&&price<=0&&stock<=0&&!img)return false;return Boolean((name&&!placeholder)||price>0||stock>0||img||(id&&!/^sdc-?\d+$/i.test(id)));}
  function normalizeState(s){
    const d = defaultState();
    const out = Object.assign(d, s||{});
    out.products = (out.products||[]).map(normalizeProduct).filter(hasRealProduct);
    out.sales = Array.isArray(out.sales)?out.sales:[];
    out.quotes = Array.isArray(out.quotes)?out.quotes:[];
    out.clients = Array.isArray(out.clients)?out.clients:[];
    out.closings = Array.isArray(out.closings)?out.closings:[];
    out.expenses = Array.isArray(out.expenses)?out.expenses:[];
    out.settings = Object.assign({}, window.SDC_CONFIG||{}, out.settings||{});
    // La conexión oficial se toma siempre desde js/data.js para que el navegador no use IDs viejos guardados en caché/localStorage.
    const cfg = window.SDC_CONFIG || {};
    ['sheetId','productSheet','webAppUrl','autoSheetSync','firebaseMode','cloudProvider','autoFirebaseSync'].forEach(k=>{
      if(cfg[k] !== undefined && cfg[k] !== null && cfg[k] !== '') out.settings[k] = cfg[k];
    });
    if(cfg.firebaseMode){
      delete out.settings.sheetId;
      out.settings.webAppUrl = '';
      out.settings.productSheet = '';
      out.settings.autoSheetSync = false;
      out.settings.cloudProvider = 'Firebase';
      out.settings.autoFirebaseSync = cfg.autoFirebaseSync !== false;
    }
    return out;
  }
  function isQuotaError(err){
    const msg=String(err && (err.message || err.name) || err || '').toLowerCase();
    return msg.includes('quota') || msg.includes('exceeded') || msg.includes('storage') || msg.includes('ns_error_dom_quota_reached');
  }
  function clearOldBackups(){
    [BACKUP_KEY,...LEGACY_BACKUP_KEYS].forEach(k=>{
      try{ localStorage.removeItem(k); }catch(e){}
    });
  }
  function trimText(v,max=1200){
    const s=String(v||'');
    if(!s) return '';
    if(s.startsWith('data:image/') || s.length>max) return '';
    return s;
  }
  function compactItem(it){
    const x=Object.assign({}, it||{});
    x.image=trimText(x.image,900);
    return x;
  }
  function compactProduct(p){
    const x=normalizeProduct(p||{});
    x.image=trimText(x.image,900);
    x.gallery=trimText(x.gallery,1200);
    return x;
  }
  function compactDoc(doc){
    const x=Object.assign({}, doc||{});
    x.items=Array.isArray(x.items)?x.items.map(compactItem):[];
    x.gifts=Array.isArray(x.gifts)?x.gifts.map(compactItem):[];
    return x;
  }
  function compactForBackup(state){
    const s=normalizeState(state);
    return {
      version:s.version,
      unlocked:s.unlocked,
      products:(s.products||[]).map(compactProduct),
      sales:(s.sales||[]).slice(0,30).map(compactDoc),
      quotes:(s.quotes||[]).slice(0,30).map(compactDoc),
      clients:(s.clients||[]).slice(0,120),
      closings:(s.closings||[]).slice(0,20),
      expenses:(s.expenses||[]).slice(0,80),
      lastReceipt:s.lastReceipt?compactDoc(s.lastReceipt):null,
      lastQuote:s.lastQuote?compactDoc(s.lastQuote):null,
      settings:s.settings||{}
    };
  }
  function safeSetMainState(state){
    const normalized=normalizeState(state);
    const payload=JSON.stringify(normalized);
    try{
      localStorage.setItem(KEY, payload);
      return normalized;
    }catch(err){
      if(!isQuotaError(err)) throw err;
      clearOldBackups();
      localStorage.setItem(KEY, payload);
      return normalized;
    }
  }
  function load(){
    // Limpia respaldos viejos si ya existe el error de cuota en el navegador.
    LEGACY_BACKUP_KEYS.forEach(k=>{try{ if(localStorage.getItem(k)) localStorage.removeItem(k); }catch(e){}});
    return normalizeState(safeJSON(localStorage.getItem(KEY), null) || defaultState())
  }
  function save(state){return safeSetMainState(state)}
  function saveBackup(state,label='Backup manual'){
    const backup={id:uid('BK'),label,date:new Date().toISOString(),state:compactForBackup(state)};
    let backups = safeJSON(localStorage.getItem(BACKUP_KEY),'[]') || [];
    backups = Array.isArray(backups)?backups:[];
    backups.unshift(backup);
    const attempts=[6,3,1];
    for(const limit of attempts){
      try{
        localStorage.setItem(BACKUP_KEY, JSON.stringify(backups.slice(0,limit)));
        return backup;
      }catch(err){
        if(!isQuotaError(err)) break;
      }
    }
    // Nunca bloquea el guardado principal por falta de espacio en respaldos.
    try{ clearOldBackups(); }catch(e){}
    try{ localStorage.setItem(BACKUP_KEY, JSON.stringify([backup])); }catch(e){}
    return backup;
  }
  function listBackups(){
    const current=safeJSON(localStorage.getItem(BACKUP_KEY),'[]') || [];
    const legacy=LEGACY_BACKUP_KEYS.flatMap(k=>safeJSON(localStorage.getItem(k),'[]') || []);
    return [...(Array.isArray(current)?current:[]), ...(Array.isArray(legacy)?legacy:[])].slice(0,8);
  }
  function restoreBackup(id){const b=listBackups().find(x=>x.id===id); if(!b) return null; save(b.state); return normalizeState(b.state)}
  function exportData(state){return JSON.stringify(normalizeState(state),null,2)}
  function importData(json){const s=normalizeState(safeJSON(json,null)); if(!s) throw new Error('Archivo no válido'); save(s); return s}
  window.SDCStore={KEY,load,save,saveBackup,listBackups,restoreBackup,exportData,importData,uid,normalizeProduct,normalizeState,clone};
})();


;/* ==== js/app.js ==== */

/* SDC V87 Mobile POS Pro: home premium + Google Sheets verificado. */
(function(){
  try{ if('scrollRestoration' in history) history.scrollRestoration='manual'; }catch(e){}
  const $ = (s,root=document)=>root.querySelector(s);
  const $$ = (s,root=document)=>Array.from(root.querySelectorAll(s));
  let state = SDCStore.load();
  state.products = dedupeProducts((state.products||[]).filter(isRealProduct));
  const app = $('#app'), modalRoot = $('#modalRoot'), toastEl = $('#toast');
  let currentView = 'catalog';
  let filter = {q:'',cat:'Todos',special:''};
  let quote;
  let saleDraft = null;
  const LOGO_SRC = 'assets/logo-sdc-2026.png';
  const RECEIPT_LOGO_SRC = 'assets/logo-sdc-receipt.png';
  const EMBEDDED_RECEIPT_LOGO = 'data:image/png;base64,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';
  function exportLogoSrc(){return EMBEDDED_RECEIPT_LOGO || RECEIPT_LOGO_SRC || LOGO_SRC;}

  function stripMergeArtifacts(){
    const bad=/codex\/review-and-improve-webpage|^={7,}|^<{7,}|^>{7,}|\bmain\b/i;
    Array.from(document.body.childNodes||[]).forEach(node=>{
      if(node.nodeType!==Node.TEXT_NODE) return;
      const txt=String(node.textContent||'').trim();
      if(!txt) return;
      if(bad.test(txt)) node.remove();
    });
  }

  const SHIPPING = {
    normal: { type:'Normal', label:'Depósito', fee:110, cod:false, note:'Producto + Lps. 110 de envío. Pago por depósito o Tigo Money.' },
    cod: { type:'COD', label:'Pagar al recibir', fee:110, cod:true, note:'Producto + Lps. 110 de envío + comisión 10%. Si sale con centavos, se redondea hacia arriba y se suma Lps. 1.' },
    local: { type:'Local', label:'Envío Local', fee:0, cod:false, note:'Entrega local con costo definido manualmente según la zona o acuerdo con el cliente.' }
  };
  const LOCAL_PLACEHOLDER = 'Por definir';
  const COD_PERCENT = 10;
  const QUOTE_UPLIFT_PERCENT = 0;
  function moneyRoundUpPlus(value){
    const v=Number(value||0);
    if(!Number.isFinite(v) || v<=0) return 0;
    const nearest=Math.round(v);
    return Math.abs(v-nearest)<0.000001 ? nearest : Math.ceil(v)+1;
  }
  function upliftQuoteUnit(value){
    return Math.round(Number(value||0));
  }
  function codGrandTotal(base){return moneyRoundUpPlus(Number(base||0)*(1+(COD_PERCENT/100)));}
  const SDC_VERSION_LABEL = 'SDC V49 MOBILE CLIENTE';
  quote = emptyQuote();

  function hydrateState(){
    state.clients = Array.isArray(state.clients)?state.clients:[];
    state.closings = Array.isArray(state.closings)?state.closings:[];
    state.expenses = Array.isArray(state.expenses)?state.expenses:[];
    state.sales = Array.isArray(state.sales)?state.sales:[];
    state.quotes = Array.isArray(state.quotes)?state.quotes:[];
    state.settings = state.settings || {};
    if(state.settings.lowStockLimit===undefined) state.settings.lowStockLimit=3;
    state.settings.codPercent=COD_PERCENT;
    if(state.settings.moneyLocked===undefined) state.settings.moneyLocked=false;
    if(state.settings.captureClean===undefined) state.settings.captureClean=false;
    state.settings.cloudProvider='Firebase';
    state.settings.firebaseMode=true;
    state.settings.autoFirebaseSync=(window.SDC_CONFIG&&window.SDC_CONFIG.autoFirebaseSync)!==false;
    state.settings.autoSheetSync=false;
    state.settings.webAppUrl='';
    state.settings.productSheet='';
    delete state.settings.sheetId;
  }
  hydrateState();
  stripMergeArtifacts();

  function money(n){return `${state.settings.currency||'Lps.'} ${Number(n||0).toLocaleString('es-HN',{maximumFractionDigits:0})}`}
  function moneyPrivate(n){return state.settings.moneyLocked?'Oculto':money(n)}
  function num(n){return Number(n||0).toLocaleString('es-HN',{maximumFractionDigits:0})}
  function nowHN(){return new Date().toLocaleString('es-HN',{timeZone:'America/Tegucigalpa',day:'2-digit',month:'short',year:'numeric',hour:'numeric',minute:'2-digit'})}
  function nowHNPanel(){return new Date().toLocaleString('es-HN',{timeZone:'America/Tegucigalpa',weekday:'short',day:'2-digit',month:'short',hour:'numeric',minute:'2-digit',second:'2-digit'}).replace(',', ' ·')}
  function cleanPhone(p){return String(p||'').replace(/\D/g,'').replace(/^5040?/,'504')}
  function isMobileDevice(){return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent||'')}
  function pad2(n){return String(n).padStart(2,'0')}
  function fileStamp(){const d=new Date(); return `${d.getFullYear()}${pad2(d.getMonth()+1)}${pad2(d.getDate())}-${pad2(d.getHours())}${pad2(d.getMinutes())}`}
  function slugFile(s,fallback='sd-comayagua'){return String(s||fallback).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,48)||fallback}
  function clientLabel(doc){const phone=cleanPhone(doc?.phone||'').slice(-8); const client=String(doc?.client||'').trim(); return slugFile(phone||client||doc?.id||'cliente')}
  function toast(msg){toastEl.textContent=msg;toastEl.classList.add('show');clearTimeout(toastEl._t);toastEl._t=setTimeout(()=>toastEl.classList.remove('show'),2600)}
  function save(){hydrateState(); SDCStore.save(state);}

  function shippingKey(doc){
    const raw=String(doc?.shippingType||'').toLowerCase();
    if(raw.includes('local')) return 'local';
    if(raw.includes('cod') || raw.includes('recibir') || doc?.cod===true) return 'cod';
    return 'normal';
  }
  function shippingLabel(doc){return SHIPPING[shippingKey(doc)].label}
  function shippingNote(doc){return SHIPPING[shippingKey(doc)].note}
  function isCodDoc(doc){return shippingKey(doc)==='cod'}
  function isLocalDoc(doc){return shippingKey(doc)==='local'}
  function applyShippingPreset(doc,type,force=true){
    const key=type==='Local'?'local':type==='COD'?'cod':'normal';
    doc.shippingType=SHIPPING[key].type;
    doc.cod=SHIPPING[key].cod;
    if(key==='normal') doc.shipping=SHIPPING.normal.fee;
    if(key==='cod') doc.shipping=SHIPPING.cod.fee;
    if(key==='local'){
      const current=Number(doc.shipping||0);
      if(force && (!current || current===SHIPPING.normal.fee || current===SHIPPING.cod.fee)) doc.shipping=0;
      if(!doc.company || ['Forza','C807','Cargo Expreso','Domicilio'].includes(String(doc.company))) doc.company='Entrega local';
    }
    if(key!=='local' && String(doc.company||'').toLowerCase().includes('local')) doc.company='Forza';
  }
  function escapeHtml(s){return String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]))}

  function rowValue(row, keys){
    if(!row || typeof row!=='object') return '';
    const lower={}; Object.keys(row).forEach(k=>lower[String(k).toLowerCase().trim()]=k);
    for(const key of keys){
      const real=Object.prototype.hasOwnProperty.call(row,key)?key:lower[String(key).toLowerCase().trim()];
      if(real && row[real]!==undefined && row[real]!==null) return String(row[real]).trim();
    }
    return '';
  }
  function rowMoney(v){
    const n=Number(String(v||'').replace(/[^0-9.-]/g,''));
    return Number.isFinite(n)?n:0;
  }
  function sheetRowHasProduct(row){
    if(!row || typeof row!=='object') return false;
    const active=rowValue(row,['activo','active','visible','estado','status']).toLowerCase();
    if(['no','false','0','inactivo','oculto','borrado','eliminado'].includes(active)) return false;
    const name=rowValue(row,['nombre','name','producto','product','titulo','title']);
    const id=rowValue(row,['id','codigo','código','sku','code']);
    const price=rowMoney(rowValue(row,['precio','price','venta','precio_venta']));
    const stock=rowMoney(rowValue(row,['stock','existencia','cantidad']));
    const img=rowValue(row,['imagen','image','img','foto','url_imagen','galeria_1']);
    const desc=rowValue(row,['descripcion','descripción','description','detalle','details']);
    const cat=rowValue(row,['categoria','categoría','category','rubro']);
    const bad=['producto','producto sin nombre','general','sin nombre','-','.'];
    if(name && !bad.includes(name.toLowerCase())) return true;
    return !!id && (price>0 || stock>0 || !!img || !!desc || !!cat);
  }
  function isRealProduct(p){
    if(!p || typeof p!=='object') return false;
    const name=String(p.name||p.nombre||'').trim();
    const bad=['producto','producto sin nombre','general','sin nombre','-','.'];
    if(!name || bad.includes(name.toLowerCase())) return false;
    return Number(p.price||p.precio||0)>0 || Number(p.stock||0)>0 || !!(p.image||p.img) || !!(p.description||p.descripcion) || parseTags(p?.categories||p?.category||p?.categoria||'').filter(x=>String(x).toLowerCase()!=='general').length>0;
  }
  function parseTags(str){
    if(Array.isArray(str)) return str.flatMap(parseTags);
    if(str && typeof str==='object') return parseTags(str.categories || str.category || str.categoria || str.etiquetas || str.tags || '');
    return String(str||'').split(/[;,|/]+/).map(x=>x.trim()).filter(x=>x && x.toLowerCase()!=='[object object]');
  }
  function inferTagsFromProduct(p){
    const hay=[p?.name,p?.nombre,p?.id,p?.codigo,p?.description,p?.descripcion].join(' ').toLowerCase();
    const tags=[];
    const add=(t)=>{if(!tags.some(x=>x.toLowerCase()===t.toLowerCase())) tags.push(t)};
    if(/dedal/.test(hay)) add('Dedales');
    if(/gatillo|trigger/.test(hay)) add('Gatillos');
    if(/enfriador|cooler|radiador/.test(hay)) add('Enfriadores');
    if(/guante/.test(hay)) add('Guantes');
    if(/aud[ií]fono|qkz|auricular|audio/.test(hay)) add('Audio');
    if(/tipo\s*c|usb\s*c/.test(hay)) add('Tipo C');
    if(/micro\s*sd|microsd|memoria/.test(hay)) add('MicroSD');
    if(/secador|zapato/.test(hay)) add('Hogar');
    if(/termo|stanley/.test(hay)) add('Termos');
    if(/gamer|juego|celular|m[óo]vil|memo/.test(hay)) add('Gamer Móvil');
    return tags;
  }
  function productTags(p){
    const direct=parseTags(p?.categories || p?.category || p?.categoria || p?.etiquetas || p?.tags).filter(x=>!['sin categoria','sin categoría','general'].includes(String(x).toLowerCase()));
    const tags=direct.length?direct:inferTagsFromProduct(p);
    return tags.length?tags:[];
  }
  function categoryText(p){return productTags(p).join(', ')}
  function firstTag(p){return productTags(p)[0]||'Producto'}
  function autoProductDescription(p={}){
    const name=String(p.name||p.nombre||'Producto').trim()||'Producto';
    const hay=[name,categoryText(p),p.id||'',p.brand||''].join(' ').toLowerCase();
    const price=Number(p.price??p.precio??0)||0;
    let base='Producto disponible en SD COMAYAGUA. Ideal para clientes que buscan buena calidad, precio claro y atención por WhatsApp.';
    if(/dedal|funda|dedos/.test(hay)) base='Dedales gamer para celular, ideales para jugar con mejor deslizamiento, comodidad y precisión. Ayudan a reducir el sudor en pantalla y son prácticos para juegos móviles como Free Fire, PUBG Mobile y Call of Duty Mobile.';
    else if(/gatillo|trigger/.test(hay)) base='Gatillos gamer para celular, prácticos para mejorar el control al apuntar, disparar y moverse en juegos móviles. Diseño cómodo para sesiones de juego más precisas.';
    else if(/enfriador|cooler|radiador|ventilador/.test(hay)) base='Enfriador gamer para celular, útil para ayudar a controlar la temperatura del equipo durante juegos o uso intenso. Ideal para mantener un rendimiento más estable.';
    else if(/aud[ií]fono|audio|bluetooth|auricular|qkz/.test(hay)) base='Accesorio de audio disponible para uso diario, llamadas, música y contenido multimedia. Consulte compatibilidad antes de confirmar su compra.';
    else if(/cable|cargador|adaptador|tipo c|micro sd|microsd|usb/.test(hay)) base='Accesorio tecnológico para uso diario. Antes de pagar, confirme compatibilidad con su dispositivo y disponibilidad actual.';
    else if(/hogar|cocina|limpieza|organizador|secador|termo/.test(hay)) base='Producto práctico para el hogar, pensado para facilitar tareas diarias con una presentación útil y funcional.';
    const cat=firstTag(p);
    const priceText=price>0?` Precio de referencia: ${money(price)}.`:'';
    return `${base}${priceText} Categoría: ${cat}. Disponible para cotización, venta y envío según zona.`;
  }
  function productDescription(p={}){return String(p.description||p.descripcion||'').trim() || autoProductDescription(p)}
  function autoProductSpecs(p={}){
    return {estado:'Nuevo',categoria:firstTag(p)||'General',pais:'Honduras',envios:'Normal Lps.110 · Pagar al Recibir Lps.110 + 10% · Local por definir'};
  }
  function isActiveProduct(p){
    return p && p.active!==false && p.activo!==false && !['no','false','0','inactivo','oculto','borrado','eliminado'].includes(String(p.status||p.estado||'').toLowerCase().trim());
  }
  function activeProducts(){return (state.products||[]).filter(isActiveProduct)}
  function allCategories(){
    const cats=Array.from(new Set(activeProducts().flatMap(p=>productTags(p)).filter(Boolean)));
    return ['Todos',...cats.sort((a,b)=>a.localeCompare(b,'es'))];
  }
  function catSlug(str){return String(str||'categoria').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'')||'categoria'}
  const CATEGORY_ASSET_SLUGS = new Set(['accesorio','accesorios','adaptador','adaptador-de-microsd','adaptador-micro-sd','adaptador-microsd','adaptadores','agotados','audifono','audifonos','audifonos-c','audifonos-qkz','audifonos-tipo-c','audio','auriculares','belleza','cable','cables','cargador','cargadores','categoria','celulares','cocina','cooler','coolers','dedales','dedales-memo','dedales-v1','dedales-v2','enfriador','enfriador-memo','enfriador-x112','enfriadores','gamer','gamer-movil','gaming','gatillo','gatillos','general','guante','guantes','guantes-memo','herramienta','herramientas','hogar','juegos','limpieza','mas-vendidos','memoria','memorias','micro-sd','microsd','nuevo','ofertas','otro','otros','promociones','secador-de-zapatos','secador-zapatos','stock-bajo','tecnologia','termo','termo-stanley','termos','tipo-c','tipo-c-audio','todas','trigger','zapato','zapatos']);
  function categoryImage(cat){const raw=String(cat||'General'); const c=raw.toLowerCase(); if(c==='todos')return 'assets/categorias/todas.svg'; const slug=catSlug(raw); if(CATEGORY_ASSET_SLUGS.has(slug)) return `assets/categorias/${slug}.svg`; return categoryFallbackSVG({category:raw,name:raw,id:'Categoría'})}
  function categoryCount(cat){const base=activeProducts(); if(cat==='Todos')return base.length; const t=String(cat).toLowerCase(); return base.filter(p=>productTags(p).some(x=>x.toLowerCase()===t)).length}

  function missingImageValue(src){
    const v=String(src||'').trim();
    if(!v) return true;
    const l=v.toLowerCase();
    return ['sin imagen','sin foto','no image','no-image','none','null','undefined','n/a','na','-','.','0'].includes(l) || /^(sin\s+imagen|sin\s+foto)$/i.test(v);
  }
  function categoryIconFor(p){
    const hay=[firstTag(p),categoryText(p),p?.name,p?.id,p?.description].join(' ').toLowerCase();
    if(/aud[ií]fono|auricular|audio|qkz|bluetooth|tipo c|manos libres|earbuds|headset/.test(hay)) return '🎧';
    if(/dedal|gatillo|trigger|gamer|gaming|free fire|pubg|call of duty|joystick|control/.test(hay)) return '🎮';
    if(/enfriador|cooler|ventilador|radiador|disipador/.test(hay)) return '❄️';
    if(/cable|cargador|adaptador|usb|micro sd|microsd|memoria|tipo c|lector/.test(hay)) return '🔌';
    if(/termo|cocina|hogar|limpieza|zapato|secador|organizador|vaso|botella/.test(hay)) return '🏠';
    if(/belleza|cosm[eé]tico|cosmetiquera|maquillaje|labial|brocha|espejo|pesta[nñ]a|cuidado/.test(hay)) return '💄';
    if(/bolso|cartera|mochila|estuche/.test(hay)) return '👜';
    if(/reloj|smartwatch|watch/.test(hay)) return '⌚';
    if(/aro de luz|tripode|tr[ií]pode|soporte|selfie/.test(hay)) return '📷';
    return '📦';
  }
  function categoryFallbackSVG(p){
    const cat=firstTag(p)||'Producto';
    const label=String(cat).replace(/\s+/g,' ').trim().slice(0,18)||'Producto';
    const icon=categoryIconFor(p);
    const slug=catSlug(label);
    const hue=[...slug].reduce((a,ch)=>a+ch.charCodeAt(0),0)%42;
    const c1=`hsl(${205+hue} 96% 50%)`;
    const c2=`hsl(${188+(hue%24)} 91% 58%)`;
    const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="900" height="900" viewBox="0 0 900 900">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient>
        <radialGradient id="r" cx="76%" cy="16%" r="68%"><stop offset="0" stop-color="#ffffff" stop-opacity=".72"/><stop offset=".52" stop-color="#ffffff" stop-opacity=".16"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/></radialGradient>
        <filter id="s" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="24" stdDeviation="22" flood-color="#03224a" flood-opacity=".18"/></filter>
      </defs>
      <rect width="900" height="900" rx="118" fill="url(#g)"/>
      <rect width="900" height="900" rx="118" fill="url(#r)"/>
      <circle cx="742" cy="148" r="180" fill="#fff" opacity=".14"/>
      <circle cx="154" cy="760" r="220" fill="#002c66" opacity=".10"/>
      <g filter="url(#s)">
        <rect x="150" y="150" width="600" height="600" rx="78" fill="#ffffff" opacity=".95"/>
        <circle cx="450" cy="450" r="150" fill="#eaf4ff"/>
        <text x="450" y="500" text-anchor="middle" font-size="160" font-family="Apple Color Emoji, Segoe UI Emoji, Arial, sans-serif">${icon}</text>
      </g>
      <rect x="288" y="700" width="324" height="64" rx="32" fill="#ffffff" opacity=".92"/>
      <text x="450" y="742" text-anchor="middle" font-size="28" font-weight="900" fill="#0a4ea3" font-family="Barlow, Arial, sans-serif">${escapeHtml(label)}</text>
    </svg>`;
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
  }
  function placeholderFor(p){return categoryFallbackSVG(p||{})}
  function captureFallbackImage(){return categoryFallbackSVG({name:'SD Comayagua',category:'Gamer'}) || LOGO_SRC}
  function galleryOf(p){
    const g=String(p?.gallery||'').split(/[\n,]+/).map(x=>x.trim()).filter(x=>!missingImageValue(x));
    const list=[p?.image,p?.img,p?.foto,p?.imagen,...g].map(x=>String(x||'').trim()).filter(x=>!missingImageValue(x));
    return Array.from(new Set(list));
  }
  function productImage(p){return galleryOf(p)[0] || categoryFallbackSVG(p||{})}
  function onImgError(img,p){img.onerror=null; img.src=categoryFallbackSVG(p||{});}
  function productById(id){return state.products.find(p=>p.id===id)}
  function nextCode(){let max=0; state.products.forEach(p=>{const m=String(p.id).match(/(\d+)$/); if(m) max=Math.max(max,Number(m[1]))}); return `SDC-${String(max+1).padStart(3,'0')}`}
  function colorKey(name){return String(name||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim()}
  function parseColorRows(value){
    const clean=(name,qty)=>{
      const label=String(name||'').trim();
      const amount=Math.max(0,Math.floor(Number(String(qty??'').replace(/[^0-9.-]/g,''))||0));
      return label?{name:label,qty:amount}:null;
    };
    if(Array.isArray(value)) return value.map(v=>{
      if(typeof v==='string'){
        const m=v.match(/^(.+?)(?:[:=]|\s+x\s+|\s+-\s+)\s*([0-9]+(?:[.,][0-9]+)?)$/i);
        return m?clean(m[1],m[2]):clean(v,0);
      }
      return clean(v?.name||v?.color||v?.colour||v?.nombre||v?.label, v?.qty??v?.cantidad??v?.stock??v?.existencia);
    }).filter(Boolean);
    if(value && typeof value==='object') return Object.entries(value).map(([name,qty])=>clean(name,qty)).filter(Boolean);
    const raw=String(value||'').trim();
    if(!raw) return [];
    try{const parsed=JSON.parse(raw); if(parsed && parsed!==raw) return parseColorRows(parsed);}catch(e){}
    return raw.split(/\s*(?:\r?\n|\||;|,)\s*/).map(part=>{
      const txt=String(part||'').trim();
      if(!txt) return null;
      let m=txt.match(/^(.+?)(?:[:=]|\s+x\s+|\s+-\s+)\s*([0-9]+(?:[.,][0-9]+)?)$/i);
      if(!m) m=txt.match(/^([0-9]+(?:[.,][0-9]+)?)\s+(.+)$/);
      if(!m) return clean(txt,0);
      return /^\d/.test(m[1])?clean(m[2],m[1]):clean(m[1],m[2]);
    }).filter(Boolean);
  }
  function mergeColorRows(rows){
    const map=new Map();
    parseColorRows(rows).forEach(r=>{
      const key=colorKey(r.name);
      if(!key) return;
      if(!map.has(key)) map.set(key,{name:r.name,qty:0});
      map.get(key).qty+=Math.max(0,Math.floor(Number(r.qty)||0));
    });
    return Array.from(map.values());
  }
  function colorRowsTotal(rows){return parseColorRows(rows).reduce((a,r)=>a+(Number(r.qty)||0),0)}
  function productColorRows(p){return mergeColorRows(p?.colors || p?.colores || p?.colorStock || p?.stockColores || p?.variantesColor || p?.variantes_color || [])}
  function hasColorStock(p){return productColorRows(p).length>0}
  function productStock(p){const rows=productColorRows(p); return rows.length?colorRowsTotal(rows):Math.max(0,Math.floor(Number(p?.stock||0)||0))}
  function normalizeProductColorStock(p){
    if(!p) return p;
    const rows=productColorRows(p).filter(r=>String(r.name||'').trim());
    p.colors=rows;
    if(rows.length) p.stock=colorRowsTotal(rows);
    else p.stock=Math.max(0,Math.floor(Number(p.stock||0)||0));
    return p;
  }
  function colorRowsText(rows){return parseColorRows(rows).filter(r=>r.name).map(r=>`${r.name}:${Math.max(0,Math.floor(Number(r.qty)||0))}`).join(' | ')}
  function colorStockSummary(p,limit=4){
    const rows=productColorRows(p).filter(r=>Number(r.qty)>0);
    if(!rows.length) return '';
    const visible=rows.slice(0,limit).map(r=>`${r.name} ${num(r.qty)}`);
    const extra=rows.length>limit?` +${rows.length-limit}`:'';
    return visible.join(' · ')+extra;
  }
  function colorStockHTML(p){
    const rows=productColorRows(p).filter(r=>Number(r.qty)>0);
    if(!rows.length) return '';
    return `<div class="color-stock-chips-v86">${rows.map(r=>`<span><b>${escapeHtml(r.name)}</b><em>${num(r.qty)}</em></span>`).join('')}</div>`;
  }
  function defaultColorForProduct(p){const rows=productColorRows(p).filter(r=>Number(r.qty)>0); return rows[0]?.name || ''}
  function selectedColorLabel(it){return String(it?.color||it?.colour||it?.colorName||'').trim()}
  function itemVariantKey(it){return `${String(it?.id||'')}::${colorKey(selectedColorLabel(it))}`}
  function itemColorLine(it){const c=selectedColorLabel(it); return c?` · Color: ${escapeHtml(c)}`:''}
  function itemColorText(it){const c=selectedColorLabel(it); return c?`Color: ${c}`:''}
  function colorQtyAvailable(p,color){
    const key=colorKey(color);
    if(!key) return productStock(p);
    const row=productColorRows(p).find(r=>colorKey(r.name)===key);
    return Math.max(0,Number(row?.qty||0));
  }
  function adjustProductColorStock(p,color,diff){
    if(!p) return;
    const rows=productColorRows(p);
    if(rows.length && color){
      const key=colorKey(color);
      let row=rows.find(r=>colorKey(r.name)===key);
      if(!row){row={name:color,qty:0}; rows.push(row);}
      row.qty=Math.max(0,Math.floor(Number(row.qty||0)-diff));
      p.colors=rows;
      p.stock=colorRowsTotal(rows);
    }else{
      p.stock=Math.max(0,Math.floor(Number(p.stock||0)-diff));
    }
  }
  function emptyQuote(){return {id:'COT-'+Date.now(),items:[],gifts:[],client:'',phone:'',department:'Comayagua',municipality:'Comayagua',reference:'',shippingType:'Normal',company:'Forza',shipping:SHIPPING.normal.fee,cod:false,discount:0,date:new Date().toISOString(),saved:false,qtyMap:{}}}
  function emptySale(){return {...emptyQuote(), id:'SDC-'+Date.now().toString().slice(-10), kind:'receipt'}}
  function itemProductRef(it){return productById(it?.id)||it||{}}
  function itemBaseUnit(it){
    const qty=Math.max(1,Number(it?.qty)||1);
    const p=itemProductRef(it);
    const promoTotal=(p && (p.promos || p.price!==undefined))?promoTotalForQty(p,qty):null;
    if(promoTotal!==null) return promoTotal/qty;
    return Number(it?.price||p?.price||0);
  }
  function itemQuotedUnit(it){
    const baseUnit=itemBaseUnit(it);
    return upliftQuoteUnit(baseUnit);
  }
  function quotedUnitPrice(value){
    return upliftQuoteUnit(Number(value||0));
  }
  function productQuotedUnit(p){
    return Math.round(Number(p?.price||0));
  }
  function productQuotedItemsTotal(p,qty=1){
    return productItemsTotal(p,qty);
  }
  function itemTotal(it){
    const qty=Math.max(1,Number(it?.qty)||1);
    return qty*itemBaseUnit(it);
  }
  function itemEffectiveUnit(it){return itemBaseUnit(it)}
  function itemPromoApplied(it){
    const qty=Math.max(1,Number(it?.qty)||1);
    const p=itemProductRef(it);
    return promoTotalForQty(p,qty)!==null;
  }
  function calc(doc){
    const products=(doc.items||[]).reduce((a,it)=>a+itemTotal(it),0);
    const shipping=Number(doc.shipping||0);
    const discount=Number(doc.discount||0);
    const base=Math.max(0,products+shipping);
    let commission=0;
    let gross=base;
    if(isCodDoc(doc)){
      gross=codGrandTotal(base);
      commission=Math.max(0,gross-base);
    }
    const delivery=shipping+commission;
    const total=Math.max(0,gross-discount);
    return {products,shipping,commission,delivery,discount,total};
  }
  function promoTiers(p){
    return parsePromoRows(p?.promos).map(r=>({qty:Number(r.qty)||0,price:Number(r.price)||0})).filter(r=>r.qty>0&&r.price>0).sort((a,b)=>a.qty-b.qty);
  }
  function promoTotalForQty(p,qty){
    qty=Math.max(1,Number(qty)||1);
    const rows=promoTiers(p);
    if(!rows.length) return null;
    const exact=rows.find(r=>r.qty===qty);
    if(exact) return exact.price;
    const tier=[...rows].reverse().find(r=>r.qty<=qty);
    if(!tier) return null;
    const unit=tier.price/tier.qty;
    return Math.round(qty*unit);
  }
  function promoLabelForMode(p,qty,mode='hn'){
    qty=Math.max(1,Number(qty)||1);
    const rows=promoTiers(p);
    if(!rows.length) return '';
    const exact=rows.find(r=>r.qty===qty);
    const tier=exact || [...rows].reverse().find(r=>r.qty<=qty);
    if(!tier) return '';
    const unitBase=tier.price/tier.qty;
    const unit=unitBase;
    return `Oferta aplicada: ${money(unit)} c/u desde ${num(tier.qty)} unidades`;
  }
  function promoLabelForQty(p,qty){
    return promoLabelForMode(p,qty,'hn');
  }
  function productItemsTotal(p,qty=1){
    qty=Math.max(1,Number(qty)||1);
    const promo=promoTotalForQty(p,qty);
    return promo!==null?promo:qty*Number(p?.price||0);
  }
  function productNormalTotalQty(p,qty=1){return productItemsTotal(p,qty)+SHIPPING.normal.fee}
  function productCodTotalQty(p,qty=1){const base=productItemsTotal(p,qty)+SHIPPING.cod.fee; return codGrandTotal(base)}
  function productNormalTotal(p){return productNormalTotalQty(p,1)}
  function productCodTotal(p){return productCodTotalQty(p,1)}
  function promoRowsForCustomer(p){
    const basePrice=Number(p.price||0);
    const rows=parsePromoRows(p.promos).map(r=>({qty:Number(r.qty)||0,price:Number(r.price)||0})).filter(r=>r.qty>0&&r.price>0);
    const hasPromos=String(p.promos||'').trim().length>0;
    if(hasPromos && basePrice>0 && !rows.some(r=>r.qty===1)) rows.unshift({qty:1,price:basePrice});
    const unique=new Map();
    rows.sort((a,b)=>a.qty-b.qty).forEach(r=>unique.set(r.qty,r));
    return Array.from(unique.values()).slice(0,14);
  }
  function promoPublicHTML(p){
    return '';
  }
  function promoWhatsAppLines(p){
    const rows=promoRowsForCustomer(p);
    if(!String(p.promos||'').trim() || !rows.length) return '';
    return rows.map(r=>{
      const quoteProducts=Number(r.price||0);
      return `• ${num(r.qty)} ${r.qty===1?'unidad':'unidades'}: Producto ${money(quoteProducts)} | Depósito ${money(quoteProducts+SHIPPING.normal.fee)} | Pagar al Recibir ${money(codGrandTotal(quoteProducts+SHIPPING.cod.fee))}`
    }).join('\n');
  }
  function setView(v){currentView=v; render(); window.scrollTo({top:0,behavior:'smooth'});}
  function getSheetApiUrl(){return ''}
  function getSheetId(){return ''}
  function getProductSheetName(){return ''}
  function normalizeSheetRemoteProduct(row,i=0){
    const activeValue = row.activo ?? row.active ?? row.visible ?? row.estado ?? row.status ?? 'TRUE';
    const activeText = String(activeValue).trim().toLowerCase();
    const isActive = !(activeValue === false || ['false','falso','0','no','inactivo','oculto','borrado','eliminado'].includes(activeText));
    const p=SDCStore.normalizeProduct({
      id: row.codigo || row.id || row.code || row.sku || `SDC-${String(i+1).padStart(3,'0')}`,
      name: row.nombre || row.name || row.producto || 'Producto sin nombre',
      categories: row.categoria || row.categorias || row.category || row.categories || row.etiquetas || '',
      brand: row.marca || row.brand || '',
      price: row.precio ?? row.price ?? row.precio_venta ?? 0,
      cost: row.costo ?? row.cost ?? row.costo_compra ?? 0,
      stock: row.stock ?? row.existencia ?? row.inventario ?? 0,
      image: row.imagen || row.image || row.foto || row.url_imagen || '',
      gallery: row.galeria || row.gallery || row.imagenes || row.galeria_extra || '',
      description: row.descripcion || row.description || row.detalle || '',
      promos: row.promos || row.promociones || row.mayoreo || row.ofertas || row.precio_mayoreo || '',
      colors: row.colores || row.colors || row.colorStock || row.stock_colores || row.stockColores || row.variantes_color || row.variantesColor || '',
      active: isActive,
      updatedAt: row.updatedAt || row.updated_at || row.fecha_actualizacion || ''
    },i);
    if(!String(p.description||'').trim()) p.description=autoProductDescription(p);
    return isActive?p:null;
  }
  function sheetJsonp(params){
    return new Promise((resolve,reject)=>{
      const base=getSheetApiUrl();
      if(!base) return reject(new Error('No hay URL /exec de Apps Script configurada.'));
      const cb='sdcSheetCb_'+Date.now()+'_'+Math.floor(Math.random()*9999);
      const url=new URL(base);
      Object.entries({...params,callback:cb,_:Date.now()}).forEach(([k,v])=>url.searchParams.set(k,v));
      const script=document.createElement('script');
      const timer=setTimeout(()=>{cleanup(); reject(new Error('Tiempo agotado conectando con Google Sheets.'));},12000);
      function cleanup(){clearTimeout(timer); delete window[cb]; script.remove();}
      window[cb]=(data)=>{cleanup(); resolve(data)};
      script.onerror=()=>{cleanup(); reject(new Error('No se pudo cargar la respuesta de Apps Script.'))};
      script.src=url.toString(); document.head.appendChild(script);
    });
  }
  async function sheetGet(params={}){
    const base=getSheetApiUrl();
    if(!base) throw new Error('No hay URL /exec de Apps Script configurada.');
    // Apps Script suele redirigir las respuestas a googleusercontent y algunos móviles
    // se ponen dramáticos con CORS. JSONP evita ese circo para lecturas/verificación.
    try{
      return await sheetJsonp(params);
    }catch(jsonpErr){
      console.warn('JSONP Sheets falló; probando fetch directo.', jsonpErr);
      const url=new URL(base);
      Object.entries({...params,_:Date.now()}).forEach(([k,v])=>url.searchParams.set(k,v));
      const res=await fetch(url.toString(),{method:'GET',cache:'no-store',redirect:'follow'});
      const txt=await res.text();
      return JSON.parse(txt);
    }
  }
  function sleep(ms){return new Promise(resolve=>setTimeout(resolve,ms));}
  function normalizeAction(action){return String(action || '').trim().toLowerCase().replace(/[^a-z0-9]/g,'');}
  function sheetErrorMessage(err){
    const msg=String(err && err.message || err || '');
    if(err && err.name === 'AbortError') return 'Google Sheets tardó demasiado en responder. Revisa conexión y vuelve a intentar.';
    if(/failed to fetch|networkerror|load failed|cors/i.test(msg)) return 'El navegador no confirmó la respuesta de Apps Script. Intenté un envío alterno y verificación.';
    return msg || 'No se pudo guardar en Google Sheets.';
  }
  function productCodeFromPayload(payload={}){
    const product=payload.product || payload;
    return String(product.codigo || product.id || payload.codigo || payload.id || payload.previousCodigo || payload.previousCode || '').trim();
  }
  function isVerifiableProductWrite(payload={}){
    const action=normalizeAction(payload.action || '');
    return ['upsertproduct','patchproduct','saveproduct','updateproduct','setactive','updatestock','batchupdatestock','adjuststock','addgalleryimages','setmainimage'].includes(action);
  }
  async function verifyProductSavedInSheets(codigo){
    const clean=String(codigo || '').trim();
    if(!clean) return null;
    try{
      const data=await sheetGet({action:'product',codigo:clean,sheetId:getSheetId(),productSheet:getProductSheetName(),_verify:Date.now()});
      if(data && data.ok && data.product) return data.product;
    }catch(err){
      console.warn('No se pudo verificar el producto en Sheets',err);
    }
    return null;
  }
  function sheetPostViaIframe(body){
    return new Promise(resolve=>{
      const base=getSheetApiUrl();
      const iframe=document.createElement('iframe');
      const form=document.createElement('form');
      const input=document.createElement('textarea');
      const frameName='sdcSheetPost_'+Date.now()+'_'+Math.floor(Math.random()*9999);
      iframe.name=frameName; iframe.style.display='none';
      form.method='POST'; form.action=base; form.target=frameName; form.style.display='none';
      input.name='payload'; input.value=JSON.stringify(body);
      form.appendChild(input);
      document.body.appendChild(iframe); document.body.appendChild(form);
      const cleanup=()=>{form.remove(); iframe.remove(); resolve(true);};
      iframe.onload=()=>setTimeout(cleanup,300);
      setTimeout(cleanup,3600);
      try{form.submit();}catch(err){console.warn('Fallback iframe Sheets falló',err); cleanup();}
    });
  }
  async function sheetPostOpaque(body){
    const base=getSheetApiUrl();
    try{
      await fetch(base,{method:'POST',mode:'no-cors',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify(body),redirect:'follow'});
      return true;
    }catch(err){
      console.warn('Fallback no-cors Sheets falló; usando iframe.',err);
      return sheetPostViaIframe(body);
    }
  }
  async function sheetPost(payload={}, opts={}){
    const base=getSheetApiUrl();
    if(!base) throw new Error('No hay URL /exec de Apps Script configurada.');
    const body={sheetId:getSheetId(),productSheet:getProductSheetName(),adminKey:state.settings.accessKey||'',...payload};
    const verifyCode=String(opts.verifyProductCode || productCodeFromPayload(payload) || '').trim();
    const mustVerify=!!(opts.verifyProductCode && isVerifiableProductWrite(payload) && verifyCode);
    const controller=window.AbortController ? new AbortController() : null;
    const timer=controller ? setTimeout(()=>controller.abort(), opts.timeout || 22000) : null;
    try{
      const res=await fetch(base,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify(body),redirect:'follow',signal:controller?controller.signal:undefined});
      const txt=await res.text();
      let data; try{data=JSON.parse(txt)}catch(e){throw new Error('Apps Script no devolvió JSON válido.')}
      if(!data.ok) throw new Error(data.error||'No se pudo guardar en Google Sheets.');
      if(mustVerify){
        await sleep(900);
        const verified=await verifyProductSavedInSheets(verifyCode);
        if(verified) return {...data, verified:true, product:verified};
        throw new Error('Apps Script respondió OK, pero el producto no apareció en la pestaña '+getProductSheetName()+'. Actualiza el Apps Script incluido en este paquete.');
      }
      return data;
    }catch(err){
      if(isVerifiableProductWrite(payload) && verifyCode){
        await sheetPostOpaque(body);
        await sleep(2400);
        let verified=await verifyProductSavedInSheets(verifyCode);
        if(!verified){
          await sheetPostViaIframe(body);
          await sleep(2400);
          verified=await verifyProductSavedInSheets(verifyCode);
        }
        if(verified) return {ok:true, verified:true, fallback:true, product:verified};
      }
      throw new Error(sheetErrorMessage(err));
    }finally{
      if(timer) clearTimeout(timer);
    }
  }
  function firebaseReadyNow(){
    return !!(window.SDC_FIREBASE && (window.cargarDesdeFirebase || window.guardarProductoFirebase));
  }
  function waitForFirebase(timeout=20000){
    if(firebaseReadyNow()) return Promise.resolve(window.SDC_FIREBASE);
    return new Promise((resolve,reject)=>{
      const started=Date.now();
      const done=()=>{cleanup(); resolve(window.SDC_FIREBASE||{});};
      const cleanup=()=>{clearInterval(timer); window.removeEventListener('sdc-firebase-ready',done);};
      window.addEventListener('sdc-firebase-ready',done,{once:true});
      const timer=setInterval(()=>{
        if(firebaseReadyNow()) return done();
        if(Date.now()-started>timeout){cleanup(); reject(new Error('Firebase no terminó de cargar. Revisa internet o el archivo js/sdc-firebase.js.'));}
      },160);
    });
  }
  function normalizeFirebaseRemoteProduct(row,i=0){
    const variants=row?.variantes || row?.colors || row?.colores || [];
    const colors=parseColorRows(variants.length?variants:(row?.colores||''));
    const stock=colors.length?colorRowsTotal(colors):Number(row?.stock||row?.stock_inicial||0)||0;
    const p=SDCStore.normalizeProduct({
      id: row?.id || row?.codigo || `SDC-${String(i+1).padStart(3,'0')}`,
      name: row?.nombre || row?.name,
      categories: row?.categorias || row?.categoria || row?.category || 'General',
      cost: row?.costo ?? row?.cost,
      price: row?.precio ?? row?.price,
      stock,
      colors,
      image: row?.img || row?.image || row?.imagen || '',
      gallery: row?.galeria || row?.gallery || '',
      description: row?.descripcion || row?.description || '',
      promos: row?.promos || row?.promociones || '',
      active: row?.activo !== false && row?.active !== false,
      updatedAt: row?.updatedAt || row?.actualizadoEn || ''
    },i);
    return normalizeProductColorStock(p);
  }

  function normalizedKeyPart(v){
    return String(v||'').normalize('NFD').replace(/[̀-ͯ]/g,'').trim().toLowerCase().replace(/\s+/g,' ');
  }
  function productIdentityNameKey(p){
    const name=normalizedKeyPart(p?.name);
    const cat=normalizedKeyPart(firstTag(p)||p?.categories||'general');
    const price=Number(p?.price||0);
    return `${name}|${cat}|${price}`;
  }
  function looksLikeOfficialCode(id){
    return /^sdc-\d+/i.test(String(id||'').trim());
  }
  function productScore(p){
    let score=0;
    const id=String(p?.id||'').trim();
    if(looksLikeOfficialCode(id)) score+=6;
    else if(id) score+=2;
    if(String(p?.image||'').trim()) score+=5;
    if(String(p?.gallery||'').trim()) score+=2;
    if(productColorRows(p).length) score+=2;
    if(Number(p?.stock||0)>0) score+=2;
    if(String(p?.description||'').trim()) score+=1;
    if(String(p?.updatedAt||'').trim()) score+=1;
    return score;
  }
  function mergeDuplicateProducts(base, extra){
    const keep=SDCStore.clone(base||{});
    const alt=SDCStore.clone(extra||{});
    if(!keep.id || (!looksLikeOfficialCode(keep.id) && looksLikeOfficialCode(alt.id))) keep.id=alt.id;
    if(!String(keep.name||'').trim()) keep.name=alt.name;
    if(!String(keep.categories||'').trim()) keep.categories=alt.categories;
    if(!String(keep.image||'').trim()) keep.image=alt.image;
    if(!String(keep.gallery||'').trim()) keep.gallery=alt.gallery;
    if(!String(keep.description||'').trim()) keep.description=alt.description;
    if(!String(keep.promos||'').trim()) keep.promos=alt.promos;
    if(!(Number(keep.price||0)>0) && Number(alt.price||0)>0) keep.price=alt.price;
    if(!(Number(keep.cost||0)>0) && Number(alt.cost||0)>0) keep.cost=alt.cost;
    if(!(Number(keep.stock||0)>0) && Number(alt.stock||0)>0) keep.stock=alt.stock;
    const keepColors=productColorRows(keep);
    const altColors=productColorRows(alt);
    if(!keepColors.length && altColors.length){
      keep.colors=altColors;
      keep.stock=colorRowsTotal(altColors);
    }
    const keepDate=Date.parse(keep.updatedAt||'')||0;
    const altDate=Date.parse(alt.updatedAt||'')||0;
    if(altDate>keepDate) keep.updatedAt=alt.updatedAt;
    return normalizeProductColorStock(keep);
  }
  function sameProductIdentity(a,b){
    const aId=normalizedKeyPart(a?.id), bId=normalizedKeyPart(b?.id);
    if(aId && bId && aId===bId) return true;
    return productIdentityNameKey(a)===productIdentityNameKey(b);
  }
  function dedupeProducts(list=[]){
    const clean=[];
    (Array.isArray(list)?list:[]).forEach(raw=>{
      const p=normalizeProductColorStock(SDCStore.normalizeProduct(raw||{}));
      if(!isRealProduct(p)) return;
      const ix=clean.findIndex(x=>sameProductIdentity(x,p));
      if(ix<0){ clean.push(p); return; }
      const current=clean[ix];
      const keepCurrent=productScore(current)>=productScore(p);
      clean[ix]=keepCurrent ? mergeDuplicateProducts(current,p) : mergeDuplicateProducts(p,current);
    });
    return clean;
  }
  function productToFirebasePayload(product){
    const p=normalizeProductColorStock(SDCStore.normalizeProduct(product||{}));
    const rows=productColorRows(p);
    return {
      id:p.id,
      codigo:p.id,
      nombre:p.name,
      categoria:firstTag(p)||'General',
      categorias:categoryText(p)||'General',
      costo:Number(p.cost||0),
      precio:Number(p.price||0),
      img:p.image||'',
      image:p.image||'',
      imagen:p.image||'',
      galeria:p.gallery||'',
      gallery:p.gallery||'',
      descripcion:productDescription(p),
      variantes:rows.length?rows.map(r=>({nombre:r.name,stock:Math.max(0,Math.floor(Number(r.qty)||0)),img:''})):[{nombre:'General',stock:productStock(p),img:''}],
      colores:colorRowsText(rows.length?rows:[{name:'General',qty:productStock(p)}]),
      stock:productStock(p),
      stock_inicial:productStock(p),
      promos:p.promos||'',
      activo:p.active!==false,
      active:p.active!==false,
      updatedAt:new Date().toISOString()
    };
  }
  async function syncProductsFromFirebase(opts={}){
    const silent=!!opts.silent;
    try{
      if(!silent) toast('Conectando con Firebase...');
      await waitForFirebase();
      if(typeof window.cargarDesdeFirebase!=='function') throw new Error('No existe cargarDesdeFirebase().');
      const raw=await window.cargarDesdeFirebase();
      const localAssets=new Map((state.products||[]).map(p=>[String(p.id||'').trim().toLowerCase(), {
        image:String(p.image||'').trim(),
        gallery:String(p.gallery||'').trim(),
        colors:productColorRows(p)
      }]));
      const repairImages=[];
      let products=dedupeProducts((Array.isArray(raw)?raw:[]).map(normalizeFirebaseRemoteProduct).filter(isRealProduct).map(p=>{
        const key=String(p.id||'').trim().toLowerCase();
        const local=localAssets.get(key);
        if(local){
          const hadRemoteImage=!!String(p.image||'').trim();
          if(!hadRemoteImage && local.image){
            p.image=local.image;
            repairImages.push(p);
          }
          if(!String(p.gallery||'').trim() && local.gallery) p.gallery=local.gallery;
          if(!productColorRows(p).length && local.colors?.length){
            p.colors=local.colors;
            p.stock=colorRowsTotal(p.colors);
          }
        }
        return normalizeProductColorStock(p);
      }));
      const localProducts=Array.isArray(state.products)?state.products:[];
      const localById=new Map(localProducts.map(p=>[String(p.id||'').trim().toLowerCase(),p]));
      const pendingIds=new Set(pendingFirebaseList().map(x=>String(x?.id||x?.product?.id||'').trim().toLowerCase()).filter(Boolean));
      products=products.map(remote=>{
        const key=String(remote.id||'').trim().toLowerCase();
        const local=localById.get(key);
        if(!local) return remote;
        const localTime=Date.parse(local.updatedAt||'')||0;
        const remoteTime=Date.parse(remote.updatedAt||'')||0;
        if(pendingIds.has(key) || localTime>remoteTime) return normalizeProductColorStock({...local});
        return remote;
      });
      localProducts.forEach(local=>{
        const key=String(local.id||'').trim().toLowerCase();
        if(!key) return;
        if(pendingIds.has(key) && !products.some(p=>String(p.id||'').trim().toLowerCase()===key)){
          products.push(normalizeProductColorStock({...local}));
        }
      });
      if(products.length){
        state.products=products;
        state.settings.lastFirebaseSync=new Date().toISOString();
        save();
        if(repairImages.length){
          setTimeout(()=>repairImages.slice(0,20).forEach(prod=>saveProductToFirebase(prod,prod.id).catch(err=>console.warn('No se pudo reparar foto en Firebase:',err))),300);
        }
        if(!silent){render(); toast(`${products.length} productos sincronizados desde Firebase.`)}
        return true;
      }
      if(!silent) toast('Firebase está conectado, pero no encontré productos activos.');
      return false;
    }catch(err){
      if(!silent) toast('No se pudo sincronizar Firebase: '+(err.message||err));
      return false;
    }
  }
  async function syncProductsFromSheets(opts={}){return syncProductsFromFirebase(opts)}
  async function syncLocal(){
    hydrateState();
    const ok=await syncProductsFromFirebase({silent:false});
    if(ok) return;
    state=SDCStore.load(); hydrateState(); state.unlocked=true; save(); applyAppearance(); render(); toast('Sincronizado con los datos guardados en este dispositivo.');
  }
  async function saveProductToFirebase(product, previousId=''){
    await waitForFirebase();
    const payload=productToFirebasePayload(product);
    if(typeof window.guardarProductoFirebase==='function') return await window.guardarProductoFirebase(payload, previousId||payload.id);
    if(previousId && typeof window.actualizarFirebase==='function'){
      await window.actualizarFirebase(previousId, payload);
      return previousId;
    }
    if(typeof window.guardarNuevoFirebase==='function'){
      return await window.guardarNuevoFirebase(payload.nombre,payload.categoria,payload.costo,payload.precio,payload.img,payload.variantes,payload.promos);
    }
    throw new Error('No encontré funciones de guardado Firebase.');
  }
  function firebaseErrorMessage(err){
    const raw=String(err && err.message ? err.message : err || '').trim();
    const low=raw.toLowerCase();
    if(low.includes('permission') || low.includes('insufficient')) return 'Firebase rechazó el guardado por permisos/reglas.';
    if(low.includes('network') || low.includes('failed to fetch') || low.includes('offline')) return 'Sin conexión estable con Firebase.';
    if(low.includes('terminó de cargar') || low.includes('no terminó')) return 'Firebase no terminó de cargar. Revisa internet o bloqueadores.';
    return raw || 'Firebase no respondió.';
  }
  function pendingFirebaseList(){
    hydrateState();
    state.settings.pendingFirebaseProducts=Array.isArray(state.settings.pendingFirebaseProducts)?state.settings.pendingFirebaseProducts:[];
    return state.settings.pendingFirebaseProducts;
  }
  function queueFirebaseProduct(product, previousId=''){
    const list=pendingFirebaseList();
    const id=String(product?.id || previousId || '').trim();
    const clean=SDCStore.clone(product||{});
    const next=list.filter(x=>String(x?.id||'')!==id);
    next.push({id, previousId:previousId||id, product:clean, queuedAt:new Date().toISOString()});
    state.settings.pendingFirebaseProducts=next.slice(-250);
    save();
    return state.settings.pendingFirebaseProducts.length;
  }
  async function flushPendingFirebaseProducts(silent=false){
    const list=[...pendingFirebaseList()];
    if(!list.length) return true;
    const remaining=[];
    let ok=0;
    if(!silent) toast(`Enviando ${list.length} pendiente${list.length===1?'':'s'} a Firebase...`);
    for(const item of list){
      try{
        await saveProductToFirebase(item.product,item.previousId||item.id);
        ok++;
      }catch(err){
        remaining.push({...item,error:firebaseErrorMessage(err),lastTry:new Date().toISOString()});
      }
    }
    state.settings.pendingFirebaseProducts=remaining;
    if(ok) state.settings.lastFirebaseSync=new Date().toISOString();
    save();
    if(!silent){
      if(remaining.length) toast(`Firebase pendiente: ${remaining.length}. Guardado local sigue seguro.`);
      else toast(`✅ Pendientes enviados a Firebase (${ok}).`);
    }
    return !remaining.length;
  }
  async function archiveProductInFirebase(productId){
    if(!productId) return false;
    await waitForFirebase();
    if(typeof window.ocultarProductoFirebase==='function') return await window.ocultarProductoFirebase(productId);
    if(typeof window.actualizarFirebase==='function'){
      await window.actualizarFirebase(productId,{activo:false,active:false,actualizadoEn:new Date().toISOString()});
      return true;
    }
    return false;
  }
  async function syncStockAfterSale(ids){
    await waitForFirebase().catch(()=>null);
    if(typeof window.actualizarStockFirebase!=='function') return false;
    const list=Array.from(ids||[]).map(id=>productById(id)).filter(Boolean);
    for(const p of list){
      await window.actualizarStockFirebase(p.id, productToFirebasePayload(p));
    }
    state.settings.lastFirebaseSync=new Date().toISOString();
    save();
    return !!list.length;
  }
  async function uploadLocalProductsToFirebase(){
    hydrateState();
    await flushPendingFirebaseProducts(true).catch(()=>false);
    const products=(state.products||[]).filter(isRealProduct).filter(isActiveProduct);
    if(!products.length) return toast('No hay productos locales activos para subir.');
    const ok=[];
    const fail=[];
    toast(`Subiendo ${products.length} productos a Firebase...`);
    for(let i=0;i<products.length;i++){
      const p=products[i];
      try{
        await saveProductToFirebase(p,p.id);
        ok.push(p.id);
        if(i===0 || (i+1)%5===0 || i===products.length-1) toast(`Firebase: ${i+1}/${products.length} productos procesados...`);
      }catch(err){
        console.warn('No se pudo subir producto a Firebase',p,err);
        fail.push({id:p.id,name:p.name,error:err&&err.message||String(err)});
      }
    }
    if(ok.length){
      state.settings.lastFirebaseSync=new Date().toISOString();
      save();
    }
    if(fail.length){
      const detail=fail.slice(0,5).map(x=>`${x.id||''} ${x.name||''}: ${x.error}`).join('\n');
      alert(`Se subieron ${ok.length}/${products.length} productos. Fallaron ${fail.length}.\n\nPrimeros errores:\n${detail}`);
      toast(`Firebase: ${ok.length}/${products.length} subidos; ${fail.length} con error.`);
    }else{
      render();
      toast(`✅ Inventario completo subido a Firebase (${ok.length}).`);
    }
  }
  async function uploadLocalProductsToSheets(){return uploadLocalProductsToFirebase()}
  async function saveDocumentToFirebase(doc, kind){
    await waitForFirebase().catch(()=>null);
    const isSale=kind==='sale' || doc?.kind==='receipt';
    const record=documentToSheetRecord(doc,isSale?'sale':'quote');
    if(isSale && typeof window.registrarVentaFirebase==='function'){
      await window.registrarVentaFirebase({ ...record, documento:SDCStore.clone(doc||{}), tipo:'venta', fecha:doc?.date||new Date().toISOString() });
      return true;
    }
    if(!isSale && typeof window.respaldarDatosFirebase==='function'){
      await window.respaldarDatosFirebase({ ultimaCotizacion:record, documento:SDCStore.clone(doc||{}) });
      return true;
    }
    return false;
  }
  function bootFirebaseSync(){
    if(!state.unlocked || state.settings.autoFirebaseSync===false) return;
    const key='sdc_firebase_sync_boot';
    if(sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key,'1');
    setTimeout(()=>syncProductsFromFirebase({silent:true}), isMobileDevice()?2600:900);
  }
  function bootSheetSync(){return bootFirebaseSync()}
  function doctorRowsHTML(rows){
    return rows.map(r=>`<div class="cart-row sheets-doctor-row-v85 ${r.ok?'ok':'bad'}"><div><b>${r.ok?'✅':'⚠️'} ${escapeHtml(r.title)}</b><br><span>${escapeHtml(r.copy||'')}</span></div></div>`).join('');
  }
  async function openSheetsDoctor(){
    const rows=[];
    const draw=(extra='')=>{
      const body=$('#sheetsDoctorBody',modalRoot);
      if(body) body.innerHTML=`${doctorRowsHTML(rows)}${extra}`;
    };
    openModal(`<div class="modal-head"><h3>Diagnóstico Firebase</h3><button class="close">×</button></div><div class="modal-body sheets-doctor-v87"><div class="card-box"><b>Revisión de conexión</b><span>Comprueba si la app puede leer productos desde Firebase y guardar cambios en la nube.</span></div><div id="sheetsDoctorBody" class="cart-list"><div class="empty-state">Probando Firebase...</div></div><div class="modal-actions sheets-doctor-actions-v87" style="position:static"><button class="btn secondary" id="doctorSyncNow">Bajar desde Firebase</button><button class="btn" id="doctorUploadNow">Subir inventario local</button></div></div>`,true);
    const add=(ok,title,copy)=>{rows.push({ok,title,copy}); draw('<div class="empty-state">Sigo probando...</div>');};
    try{
      await waitForFirebase();
      add(true,'Firebase cargó correctamente',window.SDC_FIREBASE?.projectId?`Proyecto: ${window.SDC_FIREBASE.projectId}`:'Módulo listo.');
      const raw=typeof window.cargarDesdeFirebase==='function'?await window.cargarDesdeFirebase():[];
      add(Array.isArray(raw),'Lectura de productos',Array.isArray(raw)?`${raw.length} productos leídos desde Firebase.`:'No devolvió una lista válida.');
      draw('');
    }catch(err){
      add(false,'Firebase no respondió',String(err&&err.message||err));
      draw('<div class="empty-state">Revisa internet, reglas de Firestore o el archivo js/sdc-firebase.js.</div>');
    }
    const sync=$('#doctorSyncNow',modalRoot);
    if(sync) sync.onclick=()=>syncProductsFromFirebase({silent:false});
    const upload=$('#doctorUploadNow',modalRoot);
    if(upload) upload.onclick=()=>uploadLocalProductsToFirebase();
  }

  function sheetBool(value){return !(value===false || ['false','falso','0','no','inactivo','oculto','borrado','eliminado'].includes(String(value).trim().toLowerCase()))}
  function productToSheetRecord(product, previousId=''){
    const code=String(product?.id || product?.codigo || previousId || nextCode()).trim();
    const normalized=normalizeProductColorStock(SDCStore.normalizeProduct({...product,id:code,codigo:code}));
    const rows=productColorRows(normalized);
    const record={
      codigo: code,
      nombre: normalized.name || product?.nombre || 'Producto sin nombre',
      categoria: normalized.categories || product?.categoria || 'General',
      marca: normalized.brand || product?.marca || '',
      precio: Number(normalized.price||0),
      costo: Number(normalized.cost||0),
      stock: productStock(normalized),
      colores: colorRowsText(rows),
      imagen: normalized.image || '',
      galeria: normalized.gallery || '',
      descripcion: normalized.description || '',
      promos: normalized.promos || '',
      activo: sheetBool(normalized.active),
      updatedAt: new Date().toISOString(),
      json: {...normalized, codigo:code, colores:colorRowsText(rows), colors:rows, fuente:'sdc-pos-v94'}
    };
    return record;
  }
  async function saveProductToSheets(product, previousId=''){
    if(!getSheetApiUrl()) return false;
    const originalCode=String(previousId || product?.id || product?.codigo || '').trim();
    const record=productToSheetRecord(product, originalCode);
    const attempts=[
      {action:'upsertProduct',codigo:record.codigo,previousCodigo:originalCode,product:record},
      {action:'saveProduct',codigo:record.codigo,previousCodigo:originalCode,product:record},
      {action:'updateProduct',codigo:record.codigo,previousCodigo:originalCode,product:record}
    ];
    let lastErr=null;
    for(const payload of attempts){
      try{
        const result=await sheetPost(payload,{verifyProductCode:record.codigo,timeout:26000});
        return result || true;
      }catch(err){
        lastErr=err;
        console.warn('Intento de guardado en Sheets falló:', payload.action, err);
      }
    }
    throw lastErr || new Error('No se pudo guardar en Google Sheets.');
  }
  async function archiveProductInSheets(productId){
    if(!getSheetApiUrl()) return false;
    await sheetPost({action:'setActive',codigo:productId,activo:false});
    return true;
  }
  async function updateProductStockInSheets(productId, stock){
    if(!getSheetApiUrl()) return false;
    const p=productById(productId);
    const rows=p?productColorRows(p):[];
    await sheetPost({action:'updateStock',codigo:productId,stock:Math.max(0,Number(stock)||0),colores:colorRowsText(rows)});
    return true;
  }
  async function syncStockAfterSale(ids){
    if(!getSheetApiUrl()) return false;
    const items=Array.from(ids||[]).map(id=>{
      const p=productById(id);
      return p?{codigo:p.id,stock:productStock(p),colores:colorRowsText(productColorRows(p))}:null;
    }).filter(Boolean);
    if(!items.length) return false;
    await sheetPost({action:'batchUpdateStock',items});
    return true;
  }
  function docItemsForSheet(doc){
    return (doc.items||[]).map(it=>{
      const qty=Math.max(1,Number(it.qty)||1);
      const total=itemTotal(it);
      return {
        codigo: it.id || '',
        nombre: it.name || '',
        cantidad: qty,
        color: selectedColorLabel(it),
        precio_unitario: Math.round(total/qty),
        total: total
      };
    });
  }
  function documentToSheetRecord(doc, kind){
    const isSale=kind==='sale' || doc.kind==='receipt';
    const c=calc(doc);
    const items=docItemsForSheet(doc);
    const common={
      fecha: doc.date || new Date().toISOString(),
      cliente: doc.client || '',
      telefono: doc.phone || '',
      estado: doc.status || (isSale?'Confirmada':'Cotizado'),
      observaciones: [doc.reference||'', shippingNote(doc)||''].filter(Boolean).join(' | '),
      productos_json: JSON.stringify(items),
      subtotal: c.products,
      descuento: c.discount,
      envio: c.shipping,
      comision: c.commission,
      total: c.total,
      json: {...SDCStore.clone(doc||{}), productos:items, calculo:c, fuente:'sdc-pos-v94'}
    };
    if(isSale){
      return {
        venta_id: doc.id || `VENTA-${Date.now()}`,
        departamento: doc.department || '',
        municipio: doc.municipality || '',
        direccion: doc.reference || '',
        tipo_entrega: shippingKey(doc),
        metodo_pago: shippingLabel(doc),
        ...common
      };
    }
    return {
      cotizacion_id: doc.id || `COT-${Date.now()}`,
      ...common
    };
  }
  async function saveDocumentToSheets(doc, kind){
    if(!getSheetApiUrl()) return false;
    const isSale=kind==='sale' || doc.kind==='receipt';
    const record=documentToSheetRecord(doc, isSale?'sale':'quote');
    if(isSale){
      await sheetPost({action:'saveSale',documentType:'sale',type:'sale',sale:record,document:record});
    }else{
      await sheetPost({action:'saveQuote',documentType:'cotizacion',type:'cotizacion',quote:record,document:record});
    }
    return true;
  }
  function currentAppearance(){
    return 'normal';
  }
  function applyAppearance(){
    state.settings.appearance='normal';
    document.body.classList.remove('pro-mode','pro-white-mode','gamer-mode');
    document.body.classList.toggle('turbo-mode',false);
    document.body.classList.toggle('capture-clean',!!state.settings.captureClean);
    document.body.classList.toggle('money-locked',!!state.settings.moneyLocked);
  }
  function setAppearance(){
    state.settings.appearance='normal';
    save();
    applyAppearance();
    render();
  }
  function setShellMode(mode){
    const isLogin = mode === 'login';
    document.body.classList.toggle('sdc-login-mode', isLogin);
    document.body.classList.toggle('sdc-panel-mode', !isLogin);
    const goTop = $('#goTop');
    if(goTop) goTop.style.display = 'none';
  }


  function currentPageV150(){
    const allowed=new Set(['inicio','panel','productos']);
    const p=state.settings.pageV150||localStorage.getItem('sdc_v150_page')||'inicio';
    return allowed.has(p)?p:'inicio';
  }
  function setPageV150(page){
    const allowed=new Set(['inicio','panel','productos']);
    const clean=allowed.has(page)?page:'inicio';
    state.settings.pageV150=clean;
    try{
      localStorage.setItem('sdc_v150_page',clean);
      localStorage.setItem('sdc_v97_page',clean==='panel'?'inicio':clean);
    }catch(e){}
    save();
    render();
    requestAnimationFrame(()=>{
      document.querySelector('.sdc-tabs-v150')?.scrollIntoView({behavior:'smooth',block:'start'});
    });
  }
  window.SDCSetPageV150=setPageV150;
  function pageTabsV150(){
    const p=currentPageV150();
    return `<nav class="sdc-tabs-v150 sdc-tabs-v178 no-print" aria-label="Secciones principales">
      <button type="button" class="${p==='inicio'?'active':''}" data-action="tabInicio"><i aria-hidden="true">⌂</i><b>Inicio</b></button>
      <button type="button" class="${p==='panel'?'active':''}" data-action="tabPanel"><i aria-hidden="true">▦</i><b>Panel</b></button>
      <button type="button" class="${p==='productos'?'active':''}" data-action="tabProductos"><i aria-hidden="true">▣</i><b>Productos</b></button>
    </nav>`;
  }
    function panelHTML(){
    const st=stats();
    const current=state.settings.panelCatV150||'Todos';
    const cats=allCategories();
    const rows=activeProducts().filter(p=>{
      if(current==='Todos') return true;
      return productTags(p).some(t=>String(t).toLowerCase()===String(current).toLowerCase());
    }).map(p=>{
      const stock=productStock(p);
      const cost=Number(p.cost||0);
      const price=Number(p.price||0);
      const gain=price-cost;
      const total=gain*stock;
      return {p,stock,cost,price,gain,total};
    }).sort((a,b)=>b.total-a.total);
    const panelStats=[
      ['Productos',num(rows.length)],
      ['Unidades',num(rows.reduce((a,r)=>a+r.stock,0))],
      ['Venta inventario',money(rows.reduce((a,r)=>a+r.price*r.stock,0))],
      ['Invertido',moneyPrivate(rows.reduce((a,r)=>a+r.cost*r.stock,0))],
      ['Ganancia estimada',moneyPrivate(rows.reduce((a,r)=>a+r.total,0))]
    ];
    const tableRows=rows.map(r=>`<tr>
      <td><b>${escapeHtml(r.p.name)}</b><small>${escapeHtml(firstTag(r.p)||'General')} · ${escapeHtml(r.p.id||'')}</small></td>
      <td>${moneyPrivate(r.cost)}</td>
      <td>${money(r.price)}</td>
      <td class="${r.gain>0?'ok':'bad'}">${moneyPrivate(r.gain)}</td>
      <td>${num(r.stock)}</td>
      <td class="${r.total>0?'ok':'bad'}">${moneyPrivate(r.total)}</td>
    </tr>`).join('') || `<tr><td colspan="6">Sin productos en esta categoría.</td></tr>`;
    return `<section class="panel-v150">
      <div class="panel-head-v150 panel-head-clean-v184">
        <label><span>Categoría</span><select id="panelCategorySelectV150">${cats.map(c=>`<option value="${escapeHtml(c)}" ${c===current?'selected':''}>${escapeHtml(c)}</option>`).join('')}</select></label>
      </div>
      <div class="panel-stats-v150">${panelStats.map(([a,b])=>`<article><b>${b}</b><span>${a}</span></article>`).join('')}</div>
      <div class="panel-table-wrap-v150">
        <table class="panel-table-v150"><thead><tr><th>Producto</th><th>Costo unidad</th><th>Precio venta</th><th>Ganancia unidad</th><th>Stock</th><th>Ganancia total</th></tr></thead><tbody>${tableRows}</tbody></table>
      </div>
    </section>`;
  }

  function bindPanelCategoryV150(){
    const select=$('#panelCategorySelectV150');
    if(!select || select.dataset.bound==='1') return;
    select.dataset.bound='1';
    select.addEventListener('change',e=>{
      state.settings.panelCatV150=e.target.value || 'Todos';
      save();
      render();
    });
  }

  function render(){
    applyAppearance();
    if(!state.unlocked){setShellMode('login');renderLogin();return}
    setShellMode('panel');
    const page=currentPageV150();
    document.body.dataset.sdcPageV150=page;
    app.className='app';
    app.innerHTML = `${topbar()}${pageTabsV150()}${hero()}${panelHTML()}${inventoryHTML()}${pageFooter()}`;
    bindMain();
    // V25: conectar controles de cantidad en la vista Cliente desde la primera carga del catálogo.
    bindProductCards();
  }
  function renderLogin(){
    setShellMode('login');
    app.className='login-wrap';
    app.innerHTML=`<section class="login-card">
      <img class="login-logo" src="${LOGO_SRC}" alt="Logo SD Comayagua">
      <h1 class="login-title">SDC VENTAS</h1>
      <div class="pill login-pill"><span class="dot"></span> Acceso administrativo</div>
      <div class="form-box">
        <label class="label" for="keyInput">Clave de acceso</label>
        <input id="keyInput" class="input" type="password" inputmode="numeric" placeholder="Ingresa tu clave" autocomplete="current-password">
        <button id="loginBtn" class="btn full" style="margin-top:14px">Entrar al panel</button>
      </div>
    </section>`;
    $('#loginBtn').onclick=unlock; $('#keyInput').addEventListener('keydown',e=>{if(e.key==='Enter')unlock()});
  }
  function unlock(){ if($('#keyInput').value.trim()===(state.settings.accessKey||'199311')){state.unlocked=true;save();render();bootFirebaseSync();toast('Acceso autorizado.')} else toast('Clave incorrecta.'); }
  function topbar(){
    const lastSync=lastSyncLabel();
    return `<header class="sdc-top-v178 no-print" role="banner">
      <section class="sdc-hero-v178 sdc-hero-v235" aria-label="SD Comayagua">
        <div class="sdc-brand-v178 sdc-brand-v235">
          <div class="sdc-logo-v178 sdc-logo-v235"><img src="${LOGO_SRC}" alt="SD Comayagua"></div>
          <div class="sdc-brand-text-v178 sdc-brand-text-v235">
            <small>Panel privado</small>
            <h1>SD COMAYAGUA</h1>
            <p>Catálogo · Ventas · Cotizaciones · Inventario</p>
          </div>
        </div>
        <div class="sdc-hero-tools-v178 sdc-hero-tools-v235">
          <button class="sdc-mini-menu-v178" type="button" data-sdc127="open" aria-label="Abrir menú"><span class="sdc-lines-v178" aria-hidden="true"></span><b>Menú</b></button>
          <button class="sdc-mini-sync-v178" type="button" data-action="sync" title="Sincronizar desde Firebase (${escapeHtml(lastSync)})" aria-label="Actualizar Firebase"><span aria-hidden="true">↻</span><b>Firebase</b></button>
        </div>
        <div class="sdc-status-v178 sdc-status-v235"><span>Activo</span><b>${nowHNPanel()}</b></div>
      </section>
    </header>`
  }
    function hero(){
    const st=stats();
    const m=alertMetrics();
    const salesToday=(state.sales||[]).filter(x=>isTodayISO(x.date));
    const todayTotal=salesToday.reduce((a,x)=>a+calc(x).total,0);
    const lastSales=(state.sales||[]).slice(0,3);
    const lowLimit=Number(state.settings.lowStockLimit||3);
    const lowItems=activeProducts().filter(p=>productStock(p)>0 && productStock(p)<=lowLimit).slice(0,3);
    const recentHTML=lastSales.length?lastSales.map(x=>`<article><b>${escapeHtml(x.client||'Cliente')}</b><span>${money(calc(x).total)} · ${new Date(x.date||Date.now()).toLocaleTimeString('es-HN',{hour:'numeric',minute:'2-digit'})}</span></article>`).join(''):'<article class="empty"><b>Sin recibos aún</b><span>Cuando vendas, aparecerán aquí.</span></article>';
    const lowHTML=lowItems.length?lowItems.map(p=>`<article><b>${escapeHtml(p.name)}</b><span>${num(productStock(p))} unidades · ${escapeHtml(firstTag(p)||'Producto')}</span></article>`).join(''):'<article class="empty"><b>Stock estable</b><span>No hay urgencias principales.</span></article>';
    const valueLabel=moneyPrivate(st.value);
    const profitLabel=moneyPrivate(st.profit);
    return `<section class="hero v51-hero hero-v56-clean home-hero-v87 home-hero-v94 sdc209-home" id="inicio">
      <div class="sdc209-dashboard">
        <section class="sdc209-welcome">
          <div>
            <small>Panel privado</small>
            <h2>Ventas y control</h2>
            <p>Cotiza, vende y revisa stock rápido desde tu celular o computadora.</p>
          </div>
          <button type="button" data-action="sync"><span>↻</span><b>${escapeHtml(lastSyncLabel())}</b></button>
        </section>

        <section class="sdc209-main-actions no-print" aria-label="Acciones principales">
          <button type="button" class="primary" data-action="sell"><i>⚡</i><b>Nueva venta</b><span>Factura real</span></button>
          <button type="button" data-action="quote"><i>🧾</i><b>Cotizar</b><span>Enviar cliente</span></button>
          <button type="button" data-action="tabProductos"><i>▦</i><b>Catálogo</b><span>Ver productos</span></button>
          <button type="button" data-action="categoriesSheet"><i>🧩</i><b>Categorías</b><span>Imagen cliente</span></button>
        </section>

        <section class="sdc209-kpis" aria-label="Resumen general">
          <article><span>Ventas hoy</span><b>${money(todayTotal)}</b><small>${num(salesToday.length)} recibos</small></article>
          <article><span>Productos</span><b>${num(st.count)}</b><small>${num(st.stock)} unidades</small></article>
          <article><span>Venta total</span><b>${valueLabel}</b><small>Inventario</small></article>
          <article><span>Ganancia</span><b>${profitLabel}</b><small>Estimado</small></article>
        </section>

        <section class="sdc209-alert-strip no-print">
          <button type="button" data-action="lowStock"><b>${num(m.low)}</b><span>Bajo stock</span></button>
          <button type="button" data-action="outStock"><b>${num(m.out)}</b><span>Agotados</span></button>
          <button type="button" data-action="noImage"><b>${num(m.noImage)}</b><span>Sin imagen</span></button>
          <button type="button" data-action="profit"><b>↗</b><span>Ganancias</span></button>
        </section>

        <section class="sdc209-mini-panels">
          <div class="sdc209-mini-card"><header><b>Últimos recibos</b><button data-action="receipts">Ver caja</button></header>${recentHTML}</div>
          <div class="sdc209-mini-card"><header><b>Reponer pronto</b><button data-action="lowStock">Ver</button></header>${lowHTML}</div>
        </section>
      </div>
    </section>`
  }

  function stats(){const base=activeProducts(); let count=base.length,stock=0,value=0,invested=0; base.forEach(p=>{const st=productStock(p); stock+=st; value+=st*(+p.price||0); invested+=st*(+p.cost||0)}); return {count,stock,value,invested,profit:value-invested}}
  function lastSyncLabel(){
    const d=state.settings.lastFirebaseSync?new Date(state.settings.lastFirebaseSync):null;
    if(!d || Number.isNaN(d.getTime())) return 'Firebase listo';
    return 'Firebase '+d.toLocaleTimeString('es-HN',{hour:'2-digit',minute:'2-digit'});
  }
  function inventoryLayout(){return state.settings.inventoryLayout==='one'?'one':'two'}
  function setInventoryLayout(layout){state.settings.inventoryLayout=layout==='one'?'one':'two'; save(); renderInventoryOnly(); toast(layout==='one'?'Vista de productos a 1 columna.':'Vista de productos a 2 columnas.');}
  function gridClass(){return inventoryLayout()==='one'?'grid one-col':'grid two-col'}
  function inventoryControls(){const layout=inventoryLayout(); return `<div class="section-tools no-print"><div class="layout-toggle" aria-label="Vista de productos"><button class="${layout==='one'?'active':''}" data-action="layoutOne" type="button">Grande</button><button class="${layout==='two'?'active':''}" data-action="layoutTwo" type="button">Compacta</button></div></div>`}
  function sheetsButtonHTML(){
    return `<span class="btn small ghost sheets-head-btn firebase-head-btn" title="Firebase conectado" aria-label="Firebase conectado"><span class="firebase-dot" aria-hidden="true"></span><span>Firebase</span></span>`;
  }
  function inventoryCategoryOptionsHTML(){
    const current=filter.cat||'Todos';
    return allCategories().map(c=>`<option value="${escapeHtml(c)}" ${current===c?'selected':''}>${escapeHtml(c==='Todos'?'Categorías':c)}</option>`).join('');
  }

  function categoryQuickRailHTML(){
    const cats=allCategories();
    const current=filter.cat||'Todos';
    const label=current==='Todos'?'Todas las categorías':current;
    const activeCount=categoryCount(current);
    const totalCats=Math.max(0,cats.length-1);
    return `<section class="category-selector-v195 category-selector-v235 no-print" aria-label="Categorías del catálogo">
      <div class="category-primary-v235">
        <button type="button" class="category-open-v195 category-open-v235" data-action="categoriesSheet"><i aria-hidden="true">▦</i><span>Categorías</span></button>
        <div class="category-current-v195 category-current-v235"><b>${escapeHtml(label)}</b><small>${num(activeCount)} productos · ${num(totalCats)} categorías</small></div>
      </div>
      <div class="category-mini-actions-v198 category-mini-actions-v235">
        <button type="button" class="category-mini-btn-v198" data-action="categoryGoList">Ver productos</button>
        <button type="button" class="category-mini-btn-v198" data-action="categoryPrint">Imprimir</button>
        <button type="button" class="category-mini-btn-v198 secondary" data-action="categoryCapture">Vista cliente</button>
      </div>
    </section>`;
  }
  function inventoryHeadHTML(count,list=null){
    const visibleList=Array.isArray(list)?list:filteredProducts();
    const catLabel=filter.cat&&filter.cat!=='Todos'?filter.cat:'catálogo';
    const st=stats();
    const visibleUnits=visibleList.reduce((a,p)=>a+productStock(p),0);
    const visibleOut=visibleList.filter(p=>productStock(p)<=0).length;
    const visibleLow=visibleList.filter(p=>productStock(p)>0 && productStock(p)<=Number(state.settings.lowStockLimit||3)).length;
    const visibleOk=Math.max(0,visibleList.length-visibleOut);
    const mode=cardView();
    const sync=lastSyncLabel();
    return `<div class="products-screen-v178 products-screen-v189 products-screen-v190">
      <section class="catalog-cover-v178 catalog-cover-v189" aria-label="Catálogo digital">
        <div class="catalog-cover-title-v178 catalog-cover-title-v189">
          <span class="catalog-chip-v178 catalog-chip-v189">Catálogo digital</span>
          <h2>Productos</h2>
          <p>Busca rápido, revisa stock y abre cada producto con un toque.</p>
        </div>
        <div class="catalog-mini-summary-v195" aria-label="Resumen de catálogo">
          <article class="mini-stat-v195 mini-results-v195"><span>Resultados</span><b class="count-pill">${count}</b><small>visibles</small></article>
          <article class="mini-stat-v195 metric-units-v189"><span>Unidades</span><b>${num(visibleUnits)}</b><small>actuales</small></article>
          <button type="button" class="mini-cloud-v195 cloud-pill-v189" data-action="sync" title="${escapeHtml(sync)}"><i aria-hidden="true"></i><span>Nube</span><b>Firebase</b><small>${escapeHtml(sync)}</small></button>
        </div>
        <button type="button" class="mobile-category-cta-v238 mobile-category-cta-v240 no-print" data-action="categoriesSheet" aria-label="Buscar por categoría">
          <span class="mobile-category-icon-v240" aria-hidden="true">▦</span>
          <span class="mobile-category-label-v240">CATEGORÍAS</span>
          <span class="mobile-category-arrow-v240" aria-hidden="true">›</span>
        </button>
        ${categoryQuickRailHTML()}
      </section>
      <section class="catalog-control-v178 catalog-control-v189 no-print" aria-label="Herramientas de productos">
        <label class="catalog-search-v178 catalog-search-v189" for="inventorySearchInput"><i aria-hidden="true">⌕</i><input id="inventorySearchInput" data-product-search="1" placeholder="Buscar producto, código o categoría..." value="${escapeHtml(filter.q)}" autocomplete="off" inputmode="search"></label>
        <div class="catalog-filter-row-v178 catalog-filter-row-v189 catalog-filter-row-v235">
          <button class="catalog-categories-v235" data-action="categoriesSheet" type="button"><span>▦</span><b>Categorías</b></button>
          <label class="catalog-category-v178 catalog-category-v189" for="inventoryCategorySelect"><span aria-hidden="true">▦</span><select id="inventoryCategorySelect" aria-label="Filtrar por categoría">${inventoryCategoryOptionsHTML()}</select><b aria-hidden="true">⌄</b></label>
          <button class="catalog-add-v178 catalog-add-v189" data-action="newProduct" type="button"><span>+</span><b>Producto</b></button>
        </div>
        <div class="catalog-insights-v190" aria-label="Estado rápido del catálogo">
          <button type="button" data-action="categoryGoList"><span>Disponibles</span><b>${num(visibleOk)}</b></button>
          <button type="button" data-action="lowStock"><span>Bajo stock</span><b>${num(visibleLow)}</b></button>
          <button type="button" data-action="outStock"><span>Agotados</span><b>${num(visibleOut)}</b></button>
        </div>
        <div class="catalog-view-row-v189" aria-label="Modo de vista">
          <button type="button" class="${mode==='admin'?'active':''}" data-action="cardAdmin"><span>Admin</span><small>Costos</small></button>
          <button type="button" class="${mode==='client'?'active':''}" data-action="cardClient"><span>Cliente</span><small>Venta</small></button>
          <button type="button" class="${state.settings.captureClean?'active':''}" data-action="captureClean"><span>Captura</span><small>Limpia</small></button>
        </div>
        <div class="catalog-utility-row-v178 catalog-utility-row-v189">
          <button class="catalog-tool-v178 catalog-tool-v189" data-action="categoryCapture" type="button" title="Crear imagen limpia para cliente"><span aria-hidden="true">▣</span><b>Captura ${escapeHtml(catLabel)}</b></button>
          <button class="catalog-tool-v178 catalog-tool-v189" data-action="categoryPrint" type="button" title="Vista imprimible por categoría"><span aria-hidden="true">▤</span><b>Imprimir</b></button>
        </div>
      </section>
    </div>`
  }

    function inventoryGridHTML(list){
    if(!list.length) return `<div class="empty-state">Sin productos para mostrar.</div>`;
    const out=list.filter(p=>productStock(p)<=0);
    const available=list.filter(p=>productStock(p)>0);
    const availableHTML=`<div class="${gridClass()}">${available.map(productCard).join('')}</div>`;
    if(!out.length) return availableHTML;
    return `${availableHTML}<section class="stockout-zone-v180"><div class="stockout-head-v180"><div><span>Inventario agotado</span><h3>Menos visible para no confundir</h3></div><b>${num(out.length)}</b></div><div class="${gridClass()} stockout-grid-v180">${out.map(productCard).join('')}</div></section>`;
  }
  function cardView(){return state.settings.cardView==='client'?'client':'admin'}
  function setCardView(view){state.settings.cardView=view==='client'?'client':'admin'; save(); render(); toast(state.settings.cardView==='client'?'Vista cliente activada: se ocultan costos y ganancias.':'Vista admin activada: inversión y ganancias visibles.');}
  function clientQty(id){const map=state.settings.clientQtyMap||{}; return Math.max(1,Number(map[id])||1)}
  function productDeliveryMode(id){
    state.settings.productDeliveryModeMap=state.settings.productDeliveryModeMap||{};
    const v=state.settings.productDeliveryModeMap[id];
    return v==='hn'?'hn':'local';
  }
  function setProductDeliveryMode(id,mode){
    state.settings.productDeliveryModeMap=state.settings.productDeliveryModeMap||{};
    state.settings.productDeliveryModeMap[id]=mode==='local'?'local':'hn';
    save();
    updateClientCardTotals(id);
  }
  function productLocalTotalQty(p,qty=1){return productItemsTotal(p,qty)}
  function setClientQty(id,qty){
    state.settings.clientQtyMap=state.settings.clientQtyMap||{};
    const clean=Math.max(1,Math.min(999,Number(qty)||1));
    if(id) state.settings.clientQtyMap[id]=clean;
    save();
    updateClientCardTotals(id);
  }
  function updateClientCardTotals(id){
    const p=productById(id); if(!p)return;
    const qty=clientQty(id);
    const mode=productDeliveryMode(id);
    const card=Array.from(document.querySelectorAll('article.product-card')).find(x=>x.dataset.id===id);
    if(!card)return;
    const inp=card.querySelector(`[data-cqty-input]`);
    if(inp && document.activeElement!==inp) inp.value=qty;
    const localTotal=productLocalTotalQty(p,qty), normalTotal=productNormalTotalQty(p,qty), codTotal=productCodTotalQty(p,qty);
    const set=(key,value)=>{const el=card.querySelector(`[data-client-total="${key}"]`); if(el) el.textContent=value;};
    set('qty', `${num(qty)} ${qty===1?'unidad':'unidades'}`);
    set('local', money(localTotal));
    set('normal', money(normalTotal));
    set('cod', money(codTotal));
    set('main', mode==='local'?money(localTotal):money(normalTotal));
    set('main-label', mode==='local'?'Comayagua · precio local':'Honduras · envío normal');
    card.dataset.deliveryMode=mode;
    card.querySelectorAll('[data-route-mode]').forEach(b=>b.classList.toggle('active',b.dataset.routeMode===mode));
    const panel=card.querySelector('[data-delivery-panel]');
    if(panel) panel.setAttribute('data-mode',mode);
    const offer=card.querySelector('[data-client-total="offer"]');
    if(offer){ const label=promoLabelForMode(p,qty,mode); offer.textContent=label?`🎁 ${label}`:''; offer.style.display=label?'block':'none'; }
  }
  function alertMetrics(){
    const products=activeProducts();
    const lowLimit=Number(state.settings.lowStockLimit||3);
    const lowStockProducts=products.filter(p=>productStock(p)>0 && productStock(p)<=lowLimit);
    const noCostProducts=products.filter(p=>Number(p.cost)<=0);
    const lowProfitProducts=products.filter(p=>{
      const price=Number(p.price||0), cost=Number(p.cost||0), gain=price-cost;
      return price>0 && cost>0 && gain>0 && gain<10;
    });
    const outStockProducts=products.filter(p=>productStock(p)<=0);
    const noImageProducts=products.filter(p=>!String(p.image||'').trim() && !String(p.gallery||'').trim());
    return {
      lowStockProducts,
      noCostProducts,
      lowProfitProducts,
      outStockProducts,
      noImageProducts,
      low:lowStockProducts.length,
      nocost:noCostProducts.length,
      lowMargin:lowProfitProducts.length,
      out:outStockProducts.length,
      noImage:noImageProducts.length,
      total:lowStockProducts.length+noCostProducts.length+lowProfitProducts.length+outStockProducts.length+noImageProducts.length
    };
  }

  function notificationBadgeHTML(){
    const n=alertMetrics().total;
    return n?`<em class="nav-alert-badge-v84" aria-label="${n} alertas">${n>99?'99+':n}</em>`:'';
  }

  function openNotifications(){
    const m=alertMetrics();
    const lowLimit=Number(state.settings.lowStockLimit||3);
    const products=activeProducts();
    const groups=[
      ['Bajo stock','Productos que conviene reponer pronto.',products.filter(p=>productStock(p)>0 && productStock(p)<=lowLimit),'lowStock'],
      ['Agotados','Productos que no deberían ofrecerse al cliente.',products.filter(p=>productStock(p)<=0),'outStock'],
      ['Sin imagen','Productos que necesitan foto o imagen automática.',products.filter(p=>!String(p.image||p.foto||p.img||'').trim()),'noImage'],
      ['Sin costo','Productos sin costo para calcular ganancia.',products.filter(p=>Number(p.cost)<=0),'noCost']
    ];
    const body=groups.map(([title,copy,list,act])=>{
      const rows=list.slice(0,6).map(p=>`<article class="sdc209-alert-row"><div><b>${escapeHtml(p.name)}</b><span>${num(productStock(p))} unidades · ${money(p.price)} · ${escapeHtml(firstTag(p)||'Producto')}</span></div><button type="button" data-action="${act}">Ver</button></article>`).join('') || `<article class="sdc209-alert-row empty"><div><b>Todo bien</b><span>No hay pendientes en esta sección.</span></div></article>`;
      return `<section class="sdc209-alert-box"><header><div><h4>${title}</h4><p>${copy}</p></div><strong>${num(list.length)}</strong></header>${rows}</section>`;
    }).join('');
    openModal(`<div class="modal-head sdc209-modal-head"><div><small>Centro de control</small><h3>Alertas inteligentes</h3></div><button class="close">×</button></div><div class="modal-body sdc209-alert-modal"><section class="sdc209-alert-total"><b>${num(m.total)}</b><span>alertas por revisar</span></section>${body}</div>`,true);
  }

  function quickPanel(){
    const m=alertMetrics();
    const st=stats();
    const activeTab=state.settings.homeToolsTab==='alerts'?'alerts':'options';
    const options=[
      ['cardClient','Vista','Cliente','👁️'],
      ['captureClean','Modo','Captura','📸'],
      ['catalog','Inicio','Catálogo','🏠'],
      ['categoriesSheet','Elegir','Categoría','🧩'],
      ['notifications','Centro','Alertas','🔔'],
      ['quickSale','Venta','Rápida','⚡'],
      ['quotes','Cotización','Guardadas','🧾'],
      ['clients','Agenda','Clientes','👥'],
      ['receipts','Ventas','Caja','💵'],
      ['profit','Utilidad','Ganancia','📈'],
      ['backup','Copia','Respaldo','💾'],
      ['lowStock','Alerta','Bajo stock','📦'],
      ['noCost','Revisar','Sin costo','🧮'],
      ['sync','Bajar','Nube','🔄'],
      ['uploadSheets','Subir','A Firebase','⬆️'],
      ['sheetsDoctor','Probar','Firebase','🧪']
    ];
    const optionButtons=options.map(([action,small,big,icon])=>`<button class="quick-btn quick-btn-v83" data-action="${action}"><i aria-hidden="true">${icon}</i><small>${small}</small><b>${big}</b></button>`).join('');
    const alerts=[
      ['📦',`${m.low} bajo stock`,'Productos que conviene reponer.','lowStock','Ver'],
      ['⛔',`${m.out} agotados`,'Activa reposición o archívalos.','outStock','Ver'],
      ['🧾',`${m.nocost} sin costo`,'Agrega costo para ganancia real.','noCost','Revisar'],
      ['📉',`${m.lowMargin} ganancia baja`,'Menos de Lps. 10 por unidad.','lowProfit','Detalle'],
      ['🖼️',`${m.noImage} sin imagen`,'Faltan fotos para vender mejor.','noImage','Ver'],
      ['💰',moneyPrivate(st.profit),'Ganancia estimada.','profit','Ver'],
      ['🔒',state.settings.moneyLocked?'Ganancias ocultas':'Ganancias visibles','Protege costos y utilidad.','moneyLock',state.settings.moneyLocked?'Mostrar':'Ocultar']
    ];
    const alertCards=alerts.map(([icon,title,copy,action,label])=>`<div class="alert-card alert-card-v72 alert-card-v83"><i>${icon}</i><div><b>${title}</b><span>${copy}</span></div><button class="btn small secondary" data-action="${action}">${label}</button></div>`).join('');
    return `<section class="quick no-print quick-v22 quick-private quick-panel quick-panel-v72 home-tools-v83">
      <div class="home-tools-head-v83">
        <div class="home-tools-title-v83 home-tools-title-v84"><div><b>Panel rápido</b><small>Desliza hacia la derecha para ver más sin llenar media pantalla.</small></div><span class="alert-total-v84 ${m.total?'has-alerts':''}">${m.total?`${m.total} alertas`:'Todo limpio'}</span></div>
        <div class="view-mode-buttons home-tools-tabs-v83" role="tablist" aria-label="Panel rápido">
          <button class="${activeTab==='options'?'active':''}" data-action="homeToolsOptions" type="button">Opciones</button>
          <button class="${activeTab==='alerts'?'active':''}" data-action="homeToolsAlerts" type="button">Notificaciones</button>
        </div>
      </div>
      <div class="home-tools-page-v83 ${activeTab==='options'?'active':''}" data-tools-page="options">
        <div class="quick-scroll-v83" aria-label="Opciones rápidas">${optionButtons}</div>
      </div>
      <div class="home-tools-page-v83 ${activeTab==='alerts'?'active':''}" data-tools-page="alerts">
        <div class="alert-scroll-v83" aria-label="Notificaciones del negocio">${alertCards}</div>
      </div>
    </section>`
  }


  function bestSellersFooter(){
    const map=new Map();
    (state.sales||[]).forEach(s=>{
      (s.items||[]).forEach(it=>{
        const id=it.id||it.name;
        const row=map.get(id)||{name:it.name||id,qty:0,total:0};
        const qty=Math.max(1,Number(it.qty)||1);
        row.qty+=qty; row.total+=itemTotal(it);
        map.set(id,row);
      });
    });
    const rows=Array.from(map.values()).sort((a,b)=>b.qty-a.qty||b.total-a.total).slice(0,3);
    if(!rows.length) return '<span class="footer-empty">Aún no hay ventas registradas.</span>';
    return rows.map((r,i)=>`<span><b>#${i+1}</b> ${escapeHtml(r.name)} <em>${num(r.qty)} vend.</em></span>`).join('');
  }

  function pageFooter(){
    return `<footer class="sdc-page-footer no-print footer-v54"><div class="footer-copy-v153"><span>© SD Comayagua · Todos los derechos reservados</span><b>Desarrollado por Gabriel Guerrero</b></div></footer>`
  }

  function cardModePanel(){
    const mode=cardView();
    const captureActive=!!state.settings.captureClean;
    if(captureActive){
      return `<section class="view-mode-panel no-print capture-helper-v72"><div class="view-mode-copy"><b>Captura activa</b><span>Vista limpia para mostrar productos.</span></div><div class="view-mode-buttons capture-active-buttons"><button data-action="categoryGoList">VER TODO</button><button class="active capture-live" data-action="captureClean">SALIR</button></div></section>`;
    }
    return `<section class="view-mode-panel no-print"><div class="view-mode-copy"><b>Vista</b></div><div class="view-mode-buttons"><button class="${mode==='admin'?'active':''}" data-action="cardAdmin">ADMIN</button><button class="${mode==='client'?'active':''}" data-action="cardClient">CLIENTE</button><button data-action="captureClean">CAPTURA</button></div></section>`
  }

  function searchPanel(){
    return `<section class="search-panel v10-search clean-search no-print" id="searchPanel"><div class="search-title"><b>Buscar producto</b><span>Nombre, código o categoría</span></div><div class="searchbar"><span class="icon">⌕</span><input id="searchInput" placeholder="Buscar producto..." value="${escapeHtml(filter.q)}" autocomplete="off" inputmode="search"></div></section>`}

  function categoryGallery(){
    const cats=allCategories();
    const current=filter.cat||'Todos';
    return `<section class="category-gallery no-print category-gallery-v66" id="categoriesBlock"><div class="category-head"><div><h2>Categorías</h2></div><span>${cats.length-1} categorías</span></div><div class="category-select-panel" aria-label="Selector de categorías"><label for="categorySelect"><span>Ver categoría</span><select id="categorySelect">${cats.map(c=>`<option value="${escapeHtml(c)}" ${current===c?'selected':''}>${escapeHtml(c)} · ${categoryCount(c)} productos</option>`).join('')}</select></label><button type="button" class="category-list-btn" data-action="categoryGoList">Ver lista</button></div><div class="category-current" aria-live="polite"><b id="categoryCurrentTitle">${escapeHtml(current==='Todos'?'Todas las categorías':current)}</b><span id="categoryCurrentCount">${categoryCount(current)} productos</span></div><div class="category-grid">${cats.map(c=>`<button type="button" class="category-card ${filter.cat===c?'active':''}" data-catcard="${escapeHtml(c)}"><img src="${escapeHtml(categoryImage(c))}" alt="${escapeHtml(c)}" onerror="this.onerror=null;this.src='assets/categorias/categoria.svg'"><b>${escapeHtml(c)}</b><small>${categoryCount(c)} productos</small></button>`).join('')}</div></section>`
  }

  function refreshCategoryUI(){
    $$('.chip[data-cat]').forEach(x=>x.classList.toggle('active',x.dataset.cat===filter.cat));
    $$('.cat-mini[data-minicat]').forEach(x=>x.classList.toggle('active',x.dataset.minicat===filter.cat));
    $$('.category-card').forEach(x=>x.classList.toggle('active',x.dataset.catcard===filter.cat));
    const current=filter.cat||'Todos';
    $$('#categorySelect, #inventoryCategorySelect').forEach(select=>{ if(select) select.value=current; });
    const title=$('#categoryCurrentTitle');
    if(title) title.textContent=current==='Todos'?'Todas las categorías':current;
    const count=$('#categoryCurrentCount');
    if(count) count.textContent=`${categoryCount(current)} productos`;
  }
  function scrollToInventoryList(){
    const inv=$('#inventario');
    if(!inv) return;
    const top=Math.max(0,inv.getBoundingClientRect().top+window.scrollY-94);
    window.scrollTo({top,left:0,behavior:'smooth'});
  }
  function bindInventoryToolbar(){
    const bindSearch=(search)=>{
      if(!search || search.dataset.searchBound==='1') return;
      search.dataset.searchBound='1';
      let raf=0;
      const run=()=>{
        raf=0;
        const y=window.scrollY;
        renderInventoryOnly();
        requestAnimationFrame(()=>{
          const next=$('#inventorySearchInput') || $('#searchInput');
          if(next){
            next.focus({preventScroll:true});
            try{ next.setSelectionRange(next.value.length,next.value.length); }catch(err){}
          }
          window.scrollTo({top:y,left:0,behavior:'auto'});
        });
      };
      search.addEventListener('focus',()=>document.body.classList.add('search-active'));
      search.addEventListener('blur',()=>setTimeout(()=>document.body.classList.remove('search-active'),160));
      search.addEventListener('input',e=>{filter.q=e.target.value; filter.special=''; if(!raf) raf=requestAnimationFrame(run);});
    };
    bindSearch($('#inventorySearchInput'));
    const cat=$('#inventoryCategorySelect');
    if(cat && cat.dataset.bound!=='1'){cat.dataset.bound='1';cat.addEventListener('change',e=>applyCategory(e.target.value));}
  }
  function bindProductCards(){
    document.querySelectorAll('#inventario [data-action]').forEach(btn=>{ if(btn.dataset.bound)return; btn.dataset.bound=1; btn.addEventListener('click',mainAction)});
    document.querySelectorAll('#inventario article.product-card[data-id]').forEach(card=>{
      if(card.dataset.cardBound==='1') return;
      card.dataset.cardBound='1';
      card.addEventListener('click',e=>{
        if(e.target.closest('[data-action],button,a,input,select,textarea,label')) return;
        const id=card.dataset.id || card.dataset.productId;
        if(id) openProductDetails(id);
      });
      card.addEventListener('keydown',e=>{
        if(e.key!=='Enter' && e.key!==' ') return;
        if(e.target.closest('[data-action],button,a,input,select,textarea')) return;
        e.preventDefault();
        const id=card.dataset.id || card.dataset.productId;
        if(id) openProductDetails(id);
      });
      if(!card.hasAttribute('tabindex')) card.setAttribute('tabindex','0');
      if(!card.hasAttribute('role')) card.setAttribute('role','button');
      if(!card.getAttribute('aria-label')){
        const title=(card.querySelector('h3')?.textContent || '').trim();
        card.setAttribute('aria-label', title?`Ver producto ${title}`:'Ver producto');
      }
    });
    document.querySelectorAll('#inventario [data-route-mode]').forEach(btn=>{
      if(btn.dataset.bound)return;
      btn.dataset.bound=1;
      btn.addEventListener('click',e=>{
        e.preventDefault();
        e.stopPropagation();
        setProductDeliveryMode(btn.dataset.routeId,btn.dataset.routeMode);
      });
    });
    document.querySelectorAll('#inventario [data-cqty-minus]').forEach(btn=>{if(btn.dataset.bound)return; btn.dataset.bound=1; btn.addEventListener('click',e=>{e.preventDefault();setClientQty(btn.dataset.cqtyMinus,clientQty(btn.dataset.cqtyMinus)-1)})});
    document.querySelectorAll('#inventario [data-cqty-plus]').forEach(btn=>{if(btn.dataset.bound)return; btn.dataset.bound=1; btn.addEventListener('click',e=>{e.preventDefault();setClientQty(btn.dataset.cqtyPlus,clientQty(btn.dataset.cqtyPlus)+1)})});
    document.querySelectorAll('#inventario [data-cqty-input]').forEach(inp=>{if(inp.dataset.bound)return; inp.dataset.bound=1; const update=()=>setClientQty(inp.dataset.cqtyInput,inp.value); inp.addEventListener('input',update); inp.addEventListener('change',update); inp.addEventListener('keydown',e=>{if(e.key==='Enter')inp.blur()})});
    document.querySelectorAll('#inventario [data-product-cat]').forEach(btn=>{
      if(btn.dataset.bound==='1') return;
      btn.dataset.bound='1';
      btn.addEventListener('click',e=>{
        e.preventDefault();
        e.stopPropagation();
        const cat=btn.getAttribute('data-product-cat')||'Todos';
        applyCategory(cat);
      });
    });
  }
  function renderInventoryOnly(){
    const inv=$('#inventario'); if(!inv){render();return}
    const list=filteredProducts();
    const count=inv.querySelector('.count-pill');
    const units=inv.querySelector('.metric-units-v189 > b');
    const cloud=inv.querySelector('.cloud-pill-v189 small');
    const insights=inv.querySelector('.catalog-insights-v190');
    const content=inv.querySelector('.inventory-content');
    if(count) count.textContent=String(list.length);
    if(units) units.textContent=num(list.reduce((a,p)=>a+productStock(p),0));
    if(insights){
      const out=list.filter(p=>productStock(p)<=0).length;
      const low=list.filter(p=>productStock(p)>0 && productStock(p)<=Number(state.settings.lowStockLimit||3)).length;
      const ok=Math.max(0,list.length-out);
      const vals=insights.querySelectorAll('b');
      if(vals[0]) vals[0].textContent=num(ok);
      if(vals[1]) vals[1].textContent=num(low);
      if(vals[2]) vals[2].textContent=num(out);
    }
    if(cloud) cloud.textContent=lastSyncLabel();
    if(content){
      content.innerHTML=inventoryGridHTML(list);
      const inlineSearch=inv.querySelector('#inventorySearchInput');
      if(inlineSearch && document.activeElement!==inlineSearch) inlineSearch.value=filter.q;
      const inlineCat=inv.querySelector('#inventoryCategorySelect');
      if(inlineCat) inlineCat.value=filter.cat||'Todos';
    }else{
      inv.innerHTML=`${inventoryHeadHTML(list.length,list)}<div class="inventory-content">${inventoryGridHTML(list)}</div>`;
    }
    bindProductCards();
    bindPanelCategoryV150();
    bindInventoryToolbar();
    refreshCategoryUI();
  }
  function applyCategory(cat,opts={}){const y=window.scrollY; filter.cat=cat||'Todos'; filter.special=''; renderInventoryOnly(); requestAnimationFrame(()=>{if(opts.scrollToList===false) window.scrollTo({top:y,left:0,behavior:'auto'}); else scrollToInventoryList();});}

  function filteredProducts(){
    const q=filter.q.trim().toLowerCase();
    return activeProducts().filter(p=>{
      const tags=productTags(p);
      const inCat=filter.cat==='Todos'||tags.some(t=>t.toLowerCase()===filter.cat.toLowerCase());
      const hay=[p.name,p.id,categoryText(p),p.description,p.category,p.categoria,p.etiquetas].join(' ').toLowerCase();
      let ok = inCat && (!q || hay.includes(q));
      if(filter.special==='lowStock') ok = ok && productStock(p)>0 && productStock(p)<=Number(state.settings.lowStockLimit||3);
      if(filter.special==='outStock') ok = ok && productStock(p)<=0;
      if(filter.special==='noCost') ok = ok && !(Number(p.cost||0)>0);
      if(filter.special==='lowProfit') ok = ok && Number(p.price||0)>0 && Number(p.cost||0)>0 && (Number(p.price||0)-Number(p.cost||0))>0 && (Number(p.price||0)-Number(p.cost||0))<10;
      if(filter.special==='noImage') ok = ok && !String(p.image||'').trim() && !String(p.gallery||'').trim();
      return ok;
    }).sort((a,b)=>{
      const sa=productStock(a), sb=productStock(b);
      const rankA=sa<=0?2:(sa<=Number(state.settings.lowStockLimit||3)?1:0);
      const rankB=sb<=0?2:(sb<=Number(state.settings.lowStockLimit||3)?1:0);
      if(rankA!==rankB) return rankA-rankB;
      if(sa!==sb && rankA!==2) return sb-sa;
      return String(a.name||'').localeCompare(String(b.name||''),'es',{sensitivity:'base'});
    });
  }
  function inventoryHTML(){const list=filteredProducts(); return `<section id="inventario">${inventoryHeadHTML(list.length,list)}<div class="inventory-content">${inventoryGridHTML(list)}</div></section>`}
  function status(p){
    const stock=productStock(p);
    const low=Number(state.settings.lowStockLimit||3);
    if(stock<=0) return {text:'Agotado',cls:'out'};
    if(stock<=low) return {text:'Bajo stock',cls:'low'};
    return {text:'Disponible',cls:'ok'};
  }
  function priceForQty(p,qty=1){
    const q=Math.max(1,Number(qty)||1);
    return productQuotedItemsTotal(p,q)/q;
  }

  function promoCompactText(p){
    const rows=promoTiers(p);
    if(!rows.length) return '';
    const best=rows[0];
    return `${num(best.qty)}+ por ${money(best.price)}`;
  }
  function colorCompactText(p,limit=3){
    const txt=colorStockSummary(p,limit);
    return txt || '';
  }
  function productClientFactsHTML(p,limit=3){
    const stockQty=productStock(p);
    const colors=colorCompactText(p,limit);
    const offer=promoCompactText(p);
    return `<div class="v163-product-facts"><span>Stock <b>${num(stockQty)}</b></span>${colors?`<span>Colores <b>${escapeHtml(colors)}</b></span>`:''}${offer?`<span>Oferta <b>${escapeHtml(offer)}</b></span>`:''}</div>`;
  }
  function productCard(p){
    const st=status(p);
    const stockQty=productStock(p);
    const rawColors=colorCompactText(p,3);
    const colors=rawColors && !/^general\b/i.test(String(rawColors).trim()) ? rawColors : '';
    const offer=promoCompactText(p);
    const isOut=st.cls==='out' || stockQty<=0;
    const img=productImage(p);
    const idRaw=String(p.id||'');
    const id=escapeHtml(idRaw);
    const cat=firstTag(p);
    const qty=clientQty(idRaw);
    const deliveryMode=productDeliveryMode(idRaw);
    const localTotal=productLocalTotalQty(p,qty);
    const normalTotal=productNormalTotalQty(p,qty);
    const codTotal=productCodTotalQty(p,qty);
    const mainTotal=deliveryMode==='local'?localTotal:normalTotal;
    const adminButton=cardView()==='admin'?`<button type="button" class="product-admin-v178 product-action-admin-v190" data-action="adminProduct" data-id="${id}">Admin</button>`:'';
    const quoteButton=!isOut?`<button type="button" class="product-action-quote-v190" data-action="quoteProduct" data-id="${id}">Cotizar</button>`:'';
    const sellButton=!isOut?`<button type="button" class="product-action-sell-v190" data-action="sellProduct" data-id="${id}">Vender</button>`:'';
    const waButton=(!isOut && cardView()==='client')?`<button type="button" class="product-action-wa-v190" data-action="waProduct" data-id="${id}">WhatsApp</button>`:'';
    const detailButton=`<button type="button" class="product-action-detail-v190 ${isOut?'out-view':''}" data-action="viewProduct" data-id="${id}">${isOut?'Ver':'Detalle'}</button>`;
    const outNote=isOut?'<div class="product-out-note-v180">Sin existencias por ahora</div>':'';
    const outRibbon=isOut?'<span class="stockout-ribbon-v181" aria-hidden="true">AGOTADO</span>':'';
    const metaPills=[
      cat?`<span class="meta-cat-v235">${escapeHtml(cat)}</span>`:'',
      id?`<span class="meta-code-v235">${id}</span>`:'',
      colors?`<span class="meta-colors-v235">${escapeHtml(colors)}</span>`:'',
      offer?`<span class="offer meta-offer-v235">${escapeHtml(offer)}</span>`:''
    ].filter(Boolean).join('');
    const stockLabel=`${num(stockQty)} ${stockQty===1?'unidad':'unidades'}`;
    return `<article class="product-card product-card-v178 product-card-v190 product-card-v235 ${isOut?'is-out is-agotado':''}" data-id="${id}" data-product-id="${id}" data-stock-status="${st.cls}" data-product-name="${escapeHtml(p.name||'')}" data-product-price="${escapeHtml(String(productQuotedUnit(p)||0))}" data-product-stock="${escapeHtml(String(stockQty))}">
      ${outRibbon}
      <button type="button" class="product-photo-v178 product-photo-v246" data-action="viewProduct" data-id="${id}" aria-label="Ver detalle de ${escapeHtml(p.name)}">
        <img src="${escapeHtml(img)}" alt="${escapeHtml(p.name)}" loading="lazy" crossorigin="anonymous" onerror="this.onerror=null;this.src='${escapeHtml(placeholderFor(p))}'">
        <span class="product-availability-v178 ${st.cls}"><i></i>${st.text}</span>
      </button>
      <div class="product-copy-v178 product-copy-v235 product-copy-v246">
        <div class="product-code-row-v178 product-code-row-v246">${cat?`<button type="button" class="product-cat-chip-v237" data-product-cat="${escapeHtml(cat)}">${escapeHtml(cat)}</button>`:''}${id?`<span>${id}</span>`:''}</div>
        <h3 data-action="viewProduct" data-id="${id}">${escapeHtml(p.name)}</h3>
        <div class="product-mobile-meta-v277"><span class="product-summary-status-v268"><i></i>${escapeHtml(st.text)}</span><span class="product-stock-pill-v277 ${st.cls}">${escapeHtml(stockLabel)}</span></div>
        <div class="product-price-v178 product-main-price-v245 product-main-price-v246"><strong class="${isOut?'is-out':''}" data-client-total="main">${money(mainTotal)}</strong><em class="${st.cls}" data-client-total="main-label">${deliveryMode==='local'?'Comayagua · precio local':'Honduras · envío normal'}</em></div>
        <div class="delivery-panel-v245 delivery-panel-v246" data-delivery-panel data-mode="${deliveryMode}">
          <div class="delivery-tabs-v245" role="group" aria-label="Tipo de entrega">
            <button type="button" class="${deliveryMode==='local'?'active':''}" data-route-id="${id}" data-route-mode="local">Comayagua</button>
            <button type="button" class="${deliveryMode==='hn'?'active':''}" data-route-id="${id}" data-route-mode="hn">Honduras</button>
          </div>
          <div class="delivery-qty-v245">
            <span>Cantidad</span>
            <div class="delivery-qty-box-v245">
              <button type="button" data-cqty-minus="${id}">−</button>
              <input type="number" min="1" inputmode="numeric" value="${num(qty)}" data-cqty-input="${id}" aria-label="Cantidad">
              <button type="button" data-cqty-plus="${id}">+</button>
            </div>
          </div>
          <div class="delivery-prices-v245 delivery-local-v245">
            <article><span>Comayagua</span><b data-client-total="local">${money(localTotal)}</b><small>Producto sin envío · entrega local según zona</small></article>
          </div>
          <div class="delivery-prices-v245 delivery-hn-v245">
            <article><span>Envío normal</span><b data-client-total="normal">${money(normalTotal)}</b><small>Depósito / Tigo Money</small></article>
            <article><span>Pagar al recibir</span><b data-client-total="cod">${money(codTotal)}</b><small>Envío + comisión</small></article>
          </div>
          <small class="delivery-offer-v245" data-client-total="offer" style="${promoLabelForMode(p,qty,deliveryMode)?'':'display:none'}">${promoLabelForMode(p,qty,deliveryMode)?`🎁 ${escapeHtml(promoLabelForMode(p,qty,deliveryMode))}`:''}</small>
        </div>
        ${outNote}
        <div class="product-pills-v178 product-pills-v235">${metaPills}</div>
      </div>
      <div class="product-actions-v178 product-actions-v190 product-actions-v235">
        ${cardView()==='client'?`${quoteButton}${sellButton}${waButton}`:`${adminButton}${quoteButton}${sellButton}`}
        ${detailButton}
      </div>
    </article>`;
  }

    function openProductAdminPanel(id){
    const p=productById(id);
    if(!p) return toast('Producto no encontrado.');
    const stockQty=productStock(p);
    const cost=+p.cost||0;
    const price=+p.price||0;
    const gain=price-cost;
    const invested=cost*stockQty;
    const gainTotal=gain*stockQty;
    const sellAll=price*stockQty;
    const colors=productColorRows(p);
    const colorsHTML=colors.length?colors.map(r=>`<span><b>${escapeHtml(r.color||r.name||'General')}</b><em>${num(r.qty)}</em></span>`).join(''):`<span><b>General</b><em>${num(stockQty)}</em></span>`;
    openModal(`<div class="modal-head"><h3>ADMIN</h3><button class="close">×</button></div>
      <div class="modal-body admin-private-modal-v148">
        <section class="admin-private-head-v148">
          <div><small>${escapeHtml(p.id||'SDC')}</small><h4>${escapeHtml(p.name)}</h4></div>
          <strong>${moneyPrivate(gainTotal)}</strong>
        </section>
        <section class="admin-private-grid-v148">
          <article><span>Costo compra</span><b>${moneyPrivate(cost)}</b></article>
          <article><span>Precio venta</span><b>${moneyPrivate(price)}</b></article>
          <article><span>Ganancia c/u</span><b>${moneyPrivate(gain)}</b></article>
          <article><span>Stock total</span><b>${num(stockQty)}</b></article>
          <article><span>Invertido</span><b>${moneyPrivate(invested)}</b></article>
          <article><span>Si vende todo</span><b>${moneyPrivate(sellAll)}</b></article>
          <article class="wide"><span>Ganancia estimada</span><b>${moneyPrivate(gainTotal)}</b></article>
        </section>
        <section class="admin-private-colors-v148"><span>Stock por color</span><div class="color-stock-chips-v86">${colorsHTML}</div></section>
        <div class="modal-actions" style="position:static"><button class="btn secondary full" id="adminEditProductV148">Editar producto</button></div>
      </div>`,true);
    const edit=document.getElementById('adminEditProductV148');
    if(edit) edit.onclick=()=>openProductEditor(id);
  }

  function bottomNav(){return `<nav class="bottom-nav no-print v49-bottom-nav bottom-nav-v84"><button class="nav-btn ${currentView==='catalog'?'active':''}" data-action="catalog"><i>⌂</i><span>Inicio</span></button><button class="nav-btn" data-action="focusSearch"><i>⌕</i><span>Buscar</span></button><button class="nav-btn nav-alerts-v84" data-action="notifications"><i>🔔</i><span>Alertas</span>${notificationBadgeHTML()}</button><button class="nav-btn ${currentView==='quote'?'active':''}" data-action="quote"><i>▧</i><span>Cotizar</span></button><button class="nav-btn" data-action="sell"><i>⚡</i><span>Vender</span></button><button class="nav-btn" data-action="receipts"><i>▤</i><span>Caja</span></button></nav>`}

  function bindMain(){
    if(document.body.dataset.sdcCriticalDelegates!=='1'){
      document.body.dataset.sdcCriticalDelegates='1';
      document.addEventListener('click',ev=>{
        const btn=ev.target.closest('[data-action]');
        if(!btn) return;
        const a=btn.dataset.action;
        if(a==='detail' || a==='viewProduct'){
          ev.preventDefault();
          ev.stopPropagation();
          if(btn.dataset.id) openProductDetails(btn.dataset.id);
          return;
        }
      },true);
    }
    $('[data-action="lock"]')?.addEventListener('click',()=>{state.unlocked=false;save();render()});
    const search=$('#searchInput');
    if(search && search.dataset.searchBound!=='1'){
      search.dataset.searchBound='1';
      let raf=0;
      const run=()=>{raf=0; const y=window.scrollY; renderInventoryOnly(); requestAnimationFrame(()=>{ if(document.activeElement===search){ search.focus({preventScroll:true}); window.scrollTo({top:y,left:0,behavior:'auto'}); } });};
      search.addEventListener('focus',()=>document.body.classList.add('search-active'));
      search.addEventListener('blur',()=>setTimeout(()=>document.body.classList.remove('search-active'),160));
      search.addEventListener('input',e=>{filter.q=e.target.value; filter.special=''; if(!raf) raf=requestAnimationFrame(run);});
    }
    bindInventoryToolbar();
    bindPanelCategoryV150();
    $$('#categorySelect').forEach(categorySelect=>{
      if(categorySelect && !categorySelect.dataset.bound){categorySelect.dataset.bound='1';categorySelect.addEventListener('change',e=>applyCategory(e.target.value));}
    });
    $$('.chip[data-cat]').forEach(b=>b.onclick=()=>applyCategory(b.dataset.cat));
    $$('.cat-mini[data-minicat]').forEach(b=>b.onclick=()=>applyCategory(b.dataset.minicat));
    $$('.category-card').forEach(b=>b.onclick=(ev)=>{ev.preventDefault();applyCategory(b.dataset.catcard);});
    document.querySelectorAll('[data-action]').forEach(btn=>{ if(btn.dataset.bound)return; btn.dataset.bound=1; btn.addEventListener('click',mainAction)});

    if(!document.documentElement.dataset.sdcMobileCardOpenV268){
      document.documentElement.dataset.sdcMobileCardOpenV268='1';
      document.addEventListener('click',ev=>{
        if(window.innerWidth>700) return;
        const card=ev.target?.closest?.('.product-card-v235');
        if(!card) return;
        const blocked=ev.target?.closest?.('[data-action], [data-route-id], [data-cqty-minus], [data-cqty-plus], [data-cqty-input], button, input, select, textarea, a, label');
        if(blocked) return;
        const id=card.dataset?.id || card.dataset?.productId || '';
        if(!id) return;
        ev.preventDefault();
        ev.stopPropagation();
        openProductDetails(id);
      },true);
    }

    if(!document.documentElement.dataset.sdcViewFixV43){
      document.documentElement.dataset.sdcViewFixV43='1';
      document.addEventListener('click',ev=>{
        const btn=ev.target?.closest?.('[data-action="viewProduct"], .btn-view-product, button');
        if(!btn) return;
        const text=String(btn.textContent||'').trim().toUpperCase();
        const isView=btn.dataset?.action==='viewProduct' || text==='VER';
        if(!isView) return;
        const id=btn.dataset?.id || btn.closest?.('.product-card')?.dataset?.id || btn.closest?.('[data-product-id]')?.dataset?.productId || '';
        if(!id) return;
        ev.preventDefault();
        ev.stopImmediatePropagation();
        openProductDetails(id);
      },true);
    }
  }
  function openCategoriesSheet(){
    const current=filter.cat||'Todos';
    const cats=allCategories();
    const cards=cats.map(c=>{
      const isActive=String(current).toLowerCase()===String(c).toLowerCase();
      const label=c==='Todos'?'Todas las categorías':c;
      const count=categoryCount(c);
      return `<article class="category-sheet-card-v199 ${isActive?'active':''}">
        <button type="button" class="category-sheet-main-v199" data-catpick-v191="${escapeHtml(c)}">
          <span>${escapeHtml(label)}</span><b>${num(count)}</b><small>${c==='Todos'?'Ver todo el catálogo':'Filtrar esta categoría'}</small>
        </button>
        <div class="category-sheet-actions-v199">
          <button type="button" data-catprint-v199="${escapeHtml(c)}">Imprimir</button>
          <button type="button" data-catcapture-v199="${escapeHtml(c)}">PNG</button>
        </div>
      </article>`;
    }).join('');
    openModal(`<div class="modal-head category-sheet-head-v191"><div><small>Filtro rápido</small><h3>Categorías</h3></div><button class="close">×</button></div><div class="modal-body category-sheet-v191 category-sheet-v199"><p class="category-sheet-copy-v191">Elige una categoría o genera una vista para que el cliente vea productos disponibles y precios.</p><div class="category-sheet-grid-v191 category-sheet-grid-v199">${cards}</div></div>`,true);
    $$('[data-catpick-v191]',modalRoot).forEach(btn=>{
      btn.onclick=()=>{
        const cat=btn.getAttribute('data-catpick-v191')||'Todos';
        closeModal();
        applyCategory(cat);
        toast(cat==='Todos'?'Mostrando todas las categorías.':`Categoría: ${cat}`);
      };
    });
    $$('[data-catprint-v199]',modalRoot).forEach(btn=>{
      btn.onclick=()=>{
        const cat=btn.getAttribute('data-catprint-v199')||'Todos';
        closeModal();
        applyCategory(cat,{scrollToList:false});
        setTimeout(()=>openCategoryPrintPreview(),140);
      };
    });
    $$('[data-catcapture-v199]',modalRoot).forEach(btn=>{
      btn.onclick=()=>{
        const cat=btn.getAttribute('data-catcapture-v199')||'Todos';
        closeModal();
        applyCategory(cat,{scrollToList:false});
        setTimeout(()=>exportCategorySnapshot('download'),180);
      };
    });
  }

  function mainAction(e){
    const source=(e&&e.currentTarget&&e.currentTarget.dataset&&e.currentTarget.dataset.action)
      ? e.currentTarget
      : (e&&e.target&&e.target.closest ? e.target.closest('[data-action]') : null);
    if(!source) return;
    const a=source.dataset.action, id=source.dataset.id || source.closest?.('.product-card')?.dataset?.id || '';
    if(a==='tabInicio') return setPageV150('inicio');
    if(a==='tabPanel') return setPageV150('panel');
    if(a==='tabProductos') return setPageV150('productos');
    if(a==='categoryQuick') return applyCategory(source.dataset.cat||'Todos');
    if(a==='categoriesSheet') return openCategoriesSheet();
    if(a==='catalog') return setView('catalog');
    if(a==='homeToolsOptions'){state.settings.homeToolsTab='options'; save(); render(); return;}
    if(a==='homeToolsAlerts'){state.settings.homeToolsTab='alerts'; save(); render(); return;}
    if(a==='notifications') return openNotifications();
    if(a==='focusSearch'){ const search=$('#inventorySearchInput') || $('#searchInput'); search?.scrollIntoView({behavior:'smooth',block:'center'}); setTimeout(()=>search?.focus({preventScroll:true}),250); return; }
    if(a==='categoryGoList'){ scrollToInventoryList(); return; }
    if(a==='sell') return openSale();
    if(a==='quote') return openQuote();
    if(a==='newProduct') return openProductEditor();
    if(a==='editProduct') return openProductEditor(id);
    if(a==='downloadProductPhotoDirect') return downloadProductPhotoDirect(id, source);
    if(a==='viewProduct') return openProductDetails(id);
    if(a==='adminProduct') return openProductAdminPanel(id);
    if(a==='sellProduct') return openSale(id);
    if(a==='quoteProduct') return openQuote(id);
    if(a==='backup') return openBackup();
    if(a==='sync') return syncLocal();
    if(a==='uploadSheets') return uploadLocalProductsToSheets();
    if(a==='sheetsDoctor') return openSheetsDoctor();
    if(a==='layoutOne') return setInventoryLayout('one');
    if(a==='layoutTwo') return setInventoryLayout('two');
    if(a==='cardAdmin') return setCardView('admin');
    if(a==='cardClient') return setCardView('client');
    if(a==='waProduct'){const p=productById(id); if(p)return sendProductWhatsApp(p,clientQty(id));}
    if(a==='profit') return openProfit();
    if(a==='receipts') return openReceipts();
    if(a==='quotes') return openSavedQuotes();
    if(a==='clients') return openClients();
    if(a==='dailyClose') return openDailyClose();
    if(a==='marketingProduct') return openMarketingText(id);
    if(a==='quickSale') return openQuickSale();
    if(a==='expenses') return openExpenses();
    if(a==='moneyLock') return toggleMoneyLock();
    if(a==='captureClean') return toggleCaptureClean();
    if(a==='categoryCapture') return exportCategorySnapshot('share');
    if(a==='categoryPrint') return openCategoryPrintPreview();
    if(a==='exportAll') return exportAllCSV();

    if(a==='lowStock'){filter.cat='Todos'; filter.q=''; filter.special='lowStock'; render(); setTimeout(()=>{document.getElementById('inventario')?.scrollIntoView({behavior:'smooth',block:'start'}); const n=filteredProducts().length; toast(n?`${n} productos con bajo stock filtrados.`:'No hay productos en bajo stock.');},50); return;}
    if(a==='outStock'){filter.cat='Todos'; filter.q=''; filter.special='outStock'; render(); setTimeout(()=>{document.getElementById('inventario')?.scrollIntoView({behavior:'smooth',block:'start'}); const n=filteredProducts().length; toast(n?`${n} productos agotados filtrados.`:'No hay productos agotados.');},50); return;}
    if(a==='noCost'){filter.cat='Todos'; filter.q=''; filter.special='noCost'; render(); setTimeout(()=>{document.getElementById('inventario')?.scrollIntoView({behavior:'smooth',block:'start'}); toast(`${filteredProducts().length} productos sin costo filtrados.`);},50); openNoCost(); return;}
    if(a==='lowProfit'){filter.cat='Todos'; filter.q=''; filter.special='lowProfit'; render(); setTimeout(()=>{document.getElementById('inventario')?.scrollIntoView({behavior:'smooth',block:'start'}); toast(`${filteredProducts().length} productos con ganancia baja filtrados.`);},50); openLowProfit(); return;}
    if(a==='noImage'){filter.cat='Todos'; filter.q=''; filter.special='noImage'; render(); setTimeout(()=>{document.getElementById('inventario')?.scrollIntoView({behavior:'smooth',block:'start'}); const n=filteredProducts().length; toast(n?`${n} productos sin imagen filtrados.`:'Todos los productos tienen imagen.');},50); return;}
  }

  function openModal(html,wide=false){
    document.body.classList.add('modal-open');
    document.documentElement.classList.add('modal-open-root');
    document.documentElement.scrollLeft=0; document.body.scrollLeft=0;
    modalRoot.innerHTML=`<div class="modal-backdrop"><section class="modal ${wide?'wide':''}">${html}</section></div>`;
    const m=$('.modal',modalRoot); if(m){ if(String(html||'').includes('quote-body-v176')) m.classList.add('quote-modal-v176'); if(String(html||'').includes('v49-product-detail')) m.classList.add('product-detail-modal-v221'); m.scrollLeft=0; m.scrollTop=0;}
    const mb=$('.modal-body',modalRoot); if(mb){mb.scrollLeft=0; mb.scrollTop=0;}
    $('.close',modalRoot)?.addEventListener('click',closeModal);
    modalRoot.querySelector('.modal-backdrop').addEventListener('click',e=>{if(e.target.classList.contains('modal-backdrop'))closeModal()});
  }
  function closeModal(){document.body.classList.remove('modal-open'); document.documentElement.classList.remove('modal-open-root'); modalRoot.innerHTML=''}

  function splitGallery(prod){
    const p=SDCStore.normalizeProduct(prod||{},state.products.length);
    const urls=[p.image,...String(p.gallery||'').split(/\n+/)].map(x=>String(x||'').trim()).filter(Boolean);
    return urls.length?urls:[''];
  }
  function parsePromoRows(text){
    const rows=String(text||'').split(/[\n|;]+/).map(line=>line.trim()).filter(Boolean).map(line=>{
      const clean=line.replace(/lps\.?|hnl|lempiras?|total|paquete|pares?|unidades?|uds?\.?/ig,'').replace(/,/g,'.').trim();
      const m=clean.match(/^(\d+)\s*(?:[=:]|-|→|a)\s*(\d+(?:\.\d+)?)$/i);
      return m?{qty:m[1],price:m[2]}:{qty:'',price:''};
    }).filter(r=>r.qty||r.price);
    return rows.length?rows:[{qty:'',price:''}];
  }

  function imageDataURLFromImage(img, maxChars=42000, maxSize=900, quality=0.72){
    const attempts=[
      {size:maxSize,q:quality},
      {size:760,q:0.66},
      {size:640,q:0.60},
      {size:520,q:0.56},
      {size:420,q:0.52},
      {size:340,q:0.48},
      {size:280,q:0.45},
      {size:220,q:0.42},
      {size:180,q:0.40}
    ];
    let best='';
    for(const attempt of attempts){
      const scale=Math.min(1,attempt.size/Math.max(img.width,img.height));
      const w=Math.max(1,Math.round(img.width*scale));
      const h=Math.max(1,Math.round(img.height*scale));
      const canvas=document.createElement('canvas');
      canvas.width=w; canvas.height=h;
      const ctx=canvas.getContext('2d');
      ctx.fillStyle='#ffffff'; ctx.fillRect(0,0,w,h);
      ctx.drawImage(img,0,0,w,h);
      best=canvas.toDataURL('image/jpeg',attempt.q);
      if(best.length <= maxChars) return best;
    }
    return best;
  }
  function imageFileToDataURL(file, maxSize=900, quality=0.72, maxChars=42000){
    return new Promise((resolve,reject)=>{
      if(!file || !file.type || !file.type.startsWith('image/')) return reject(new Error('Seleccione una imagen válida.'));
      const reader=new FileReader();
      reader.onerror=()=>reject(new Error('No se pudo leer la imagen.'));
      reader.onload=()=>{
        const img=new Image();
        img.onload=()=>resolve(imageDataURLFromImage(img,maxChars,maxSize,quality));
        img.onerror=()=>reject(new Error('No se pudo procesar la imagen.'));
        img.src=reader.result;
      };
      reader.readAsDataURL(file);
    });
  }
  function compactDataImage(value, maxChars=42000, maxSize=900, quality=0.72){
    const raw=String(value || '').trim();
    if(!/^data:image\//i.test(raw) || raw.length <= maxChars) return Promise.resolve(raw);
    return new Promise(resolve=>{
      const img=new Image();
      img.onload=()=>resolve(imageDataURLFromImage(img,maxChars,maxSize,quality));
      img.onerror=()=>resolve(raw);
      img.src=raw;
    });
  }
  async function compactProductImages(images){
    const incoming=(images || []).map(x=>String(x || '').trim()).filter(Boolean);
    const out=[];
    const galleryCount=Math.max(1,incoming.length-1);
    const galleryMax=Math.max(5200,Math.floor(42000/galleryCount)-300);
    for(let i=0;i<incoming.length;i++){
      const isMain=i===0;
      out.push(await compactDataImage(incoming[i], isMain?42000:galleryMax, isMain?900:420, isMain?0.72:0.52));
    }
    return out;
  }

  function productForm(p={}){
    const prod=SDCStore.normalizeProduct(p,state.products.length);
    if(!p.id) prod.id=nextCode();
    const isEdit=!!p.id;
    const actionButtons=`<button class="btn" id="saveProduct" data-sdc-native-save="1" type="button">Guardar y sincronizar</button><button class="btn danger stockout-product-btn-v169" id="markProductOut" type="button">AGOTADO</button>${isEdit?`<button class="btn secondary" id="duplicateProduct" type="button">Duplicar</button><button class="btn danger" id="deleteProduct" type="button">Eliminar</button>`:''}`;
    return `<div class="modal-head"><h3>${isEdit?'Editar':'Nuevo'} producto</h3><button class="close">×</button></div>
    <div class="modal-body product-editor product-editor-v83">
      <div class="card-box product-sync-note-v83">
        <b>Guardado automático</b>
        <span>Al tocar “Guardar y sincronizar”, se guarda en este dispositivo y se envía a Firebase con la misma base de datos de la página.</span>
      </div>
      <div class="card-box"><h4>Información básica</h4>
        <div class="modal-grid">
          <label><span class="label">Nombre del producto</span><input id="pName" class="input" value="${escapeHtml(isEdit?prod.name:'')}" placeholder="Producto sin nombre"></label>
          <label><span class="label">Código</span><input id="pId" class="input" value="${escapeHtml(prod.id)}"></label>
          <label class="span2"><span class="label">Categorías / etiquetas</span><input id="pCats" class="input" value="${escapeHtml(prod.categories)}" placeholder="Ejemplo: Dedales, Gamer Móvil"></label>
          <label><span class="label">Costo compra</span><input id="pCost" class="input" type="number" min="0" step="0.01" value="${isEdit?prod.cost:''}" placeholder="Costo compra"></label>
          <label><span class="label">Precio venta</span><input id="pPrice" class="input" type="number" min="0" step="0.01" value="${isEdit?prod.price:''}" placeholder="Precio venta"></label>
          <label><span class="label">Stock general</span><input id="pStock" class="input" type="number" min="0" step="1" inputmode="numeric" placeholder="Stock general" value="${isEdit?prod.stock:''}"></label>
          <div class="span2 color-editor-box-v86"><span class="label">Colores y cantidades</span><div class="color-help-v86"><b>Stock por color:</b> agregue gris 7, amarillo 3, anaranjado 10. Si usa colores, el stock general se calcula solo. Tecnología, haciendo por fin algo útil.</div><div id="colorRows" class="color-rows-v86"></div><button class="btn secondary full add-line" id="addColorRow" type="button">+ Agregar color</button><small class="hint" id="colorStockHint">Sin colores: se usa el stock general.</small></div>
          <div class="span2 image-upload-box-v83"><span class="label">Imágenes del producto</span><div id="imageRows" class="image-rows image-rows-v83"></div><button class="btn secondary full add-line" id="addImageRow" type="button">+ Añadir otra imagen</button><small class="hint">La imagen 1 será la principal. Usa “Subir” para escoger foto desde el celular o pega un enlace si ya la tienes en internet.</small></div>
          <div class="span2 promo-editor-box"><span class="label">Ofertas por cantidad</span><div class="promo-help"><b>Regla clara:</b> Cantidad mínima + precio total del paquete. Ejemplo: 20 pares a Lps.20 c/u = Cantidad 20 y Total 400.</div><div id="promoRows" class="promo-rows"></div><button class="btn secondary full add-line" id="addPromoRow" type="button">+ Agregar oferta</button><small class="hint">El sistema aplica la mejor oferta automáticamente en cotización, WhatsApp, factura y caja.</small></div>
          <textarea id="pDesc" class="textarea" hidden>${escapeHtml(prod.description||'')}</textarea>
        </div>
        <div class="chips">${['Gamer Móvil','Dedales','Gatillos','Tecnología','Celulares','Audio','Cables','Hogar','Cocina'].map(c=>`<button class="chip" data-addcat="${c}">${c}</button>`).join('')}</div>
      </div>
      <div class="modal-actions product-form-actions product-form-actions-v83">${actionButtons}</div>
      <div id="productSaveStatus" class="product-save-status" aria-live="polite"></div>
    </div>`
  }

  function openProductEditor(id){
    const p=id?productById(id):{}; const prod=SDCStore.normalizeProduct(p||{},state.products.length);
    let imageRows=splitGallery(prod); let promoRows=parsePromoRows(prod.promos); let colorRows=productColorRows(prod); if(!colorRows.length) colorRows=[{name:'',qty:''}];
    openModal(productForm(p),true);
    function drawImages(){
      const html=imageRows.map((url,i)=>{
        const clean=String(url||'').trim();
        const has=!!clean;
        const isData=/^data:image\//i.test(clean);
        const inputValue=isData?'Imagen subida desde el celular':clean;
        const preview=has?`<img src="${escapeHtml(clean)}" alt="Imagen ${i+1}" onerror="this.closest('.image-preview-v83').classList.add('is-broken')">`:`<span>Sin imagen</span>`;
        return `<div class="mini-row image-row image-row-upload image-row-v83">
          <div class="image-preview-v83 ${has?'has-image':'is-empty'}">${preview}</div>
          <div class="image-row-main-v83">
            <div class="image-row-title-v83"><strong>Imagen ${i+1}${i===0?' · Principal':''}</strong><small>${has?(isData?'Foto subida y comprimida':'Enlace de imagen listo'):'Agrega una foto o enlace'}</small></div>
            <input class="input pImageUrl" value="${escapeHtml(inputValue)}" ${isData?'readonly':''} placeholder="Pegar enlace de imagen (opcional)">
            <div class="image-row-actions-v83">
              <label class="btn small secondary upload-image-btn">Subir<input data-upload-image="${i}" type="file" accept="image/*" hidden></label>
              <button class="btn small ghost" data-delimage="${i}" type="button">Quitar</button>
            </div>
          </div>
        </div>`;
      }).join('');
      $('#imageRows',modalRoot).innerHTML=html;
      $$('.pImageUrl',modalRoot).forEach((inp,i)=>inp.oninput=()=>{if(!inp.readOnly) imageRows[i]=inp.value});
      $$('[data-upload-image]',modalRoot).forEach(inp=>inp.onchange=async()=>{const i=+inp.dataset.uploadImage; const file=inp.files&&inp.files[0]; if(!file)return; try{toast('Preparando imagen...'); imageRows[i]=await imageFileToDataURL(file, i===0?900:460, i===0?0.72:0.54, i===0?42000:9000); drawImages(); toast(`Imagen ${i+1} lista para guardar.`);}catch(err){console.error(err); toast(err.message||'No se pudo cargar la imagen.');}});
      $$('[data-delimage]',modalRoot).forEach(b=>b.onclick=()=>{if(imageRows.length>1)imageRows.splice(+b.dataset.delimage,1);else imageRows[0]='';drawImages()});
    }


    function drawColors(){
      const wrap=$('#colorRows',modalRoot);
      if(!wrap) return;
      wrap.innerHTML=colorRows.map((r,i)=>`<div class="mini-row color-row-v86">
        <label><small>Color</small><input class="input pColorName" value="${escapeHtml(r.name||'')}" placeholder="Ej. gris"></label>
        <label><small>Cantidad</small><input class="input pColorQty" type="number" min="0" step="1" inputmode="numeric" value="${escapeHtml(r.qty??'')}" placeholder="0"></label>
        <button class="btn small ghost color-delete-btn" data-delcolor="${i}" type="button" aria-label="Eliminar color ${i+1}">×</button>
      </div>`).join('');
      const updateHint=()=>{
        const clean=mergeColorRows(colorRows).filter(x=>String(x.name||'').trim());
        const total=colorRowsTotal(clean);
        const hint=$('#colorStockHint',modalRoot);
        if(hint) hint.innerHTML=clean.length?`Stock por colores: <b>${num(total)}</b> unidades. Se usará este total al guardar.`:'Sin colores: se usa el stock general.';
        const stockInput=$('#pStock',modalRoot);
        if(stockInput && clean.length) stockInput.value=String(total);
      };
      $$('.color-row-v86',modalRoot).forEach((row,i)=>{
        $('.pColorName',row).oninput=e=>{colorRows[i].name=e.target.value; updateHint();};
        $('.pColorQty',row).oninput=e=>{
          const raw=String(e.target.value||'').trim();
          if(raw===''){ colorRows[i].qty=''; updateHint(); return; }
          colorRows[i].qty=Math.max(0,Math.floor(Number(raw)||0));
          e.target.value=String(colorRows[i].qty);
          updateHint();
        };
      });
      $$('[data-delcolor]',modalRoot).forEach(b=>b.onclick=()=>{if(colorRows.length>1)colorRows.splice(+b.dataset.delcolor,1);else colorRows[0]={name:'',qty:''};drawColors();});
      updateHint();
    }

    function drawPromos(){
      $('#promoRows',modalRoot).innerHTML=promoRows.map((r,i)=>{const q=Number(r.qty)||0, pr=Number(r.price)||0, unit=q&&pr?money(pr/q):'—'; return `<div class="mini-row promo-row promo-row-v26 promo-row-v49"><div class="promo-row-title"><strong>Oferta ${i+1}</strong><small>Precio por cantidad</small></div><label class="promo-field promo-qty-field"><small>Cantidad mínima</small><input class="input pPromoQty" inputmode="numeric" type="number" value="${escapeHtml(r.qty)}" placeholder="Ej. 20"></label><label class="promo-field promo-total-field"><small>Total paquete</small><input class="input pPromoPrice" inputmode="numeric" type="number" value="${escapeHtml(r.price)}" placeholder="Ej. 400"></label><div class="promo-unit-preview"><span>Precio c/u</span><b>${unit}</b></div><button class="btn small ghost promo-delete-btn" data-delpromo="${i}" type="button" aria-label="Eliminar oferta ${i+1}">×</button></div>`}).join('');
      $$('.promo-row',modalRoot).forEach((row,i)=>{ $('.pPromoQty',row).oninput=e=>promoRows[i].qty=e.target.value; $('.pPromoPrice',row).oninput=e=>promoRows[i].price=e.target.value; });
      $$('[data-delpromo]',modalRoot).forEach(b=>b.onclick=()=>{if(promoRows.length>1)promoRows.splice(+b.dataset.delpromo,1);else promoRows[0]={qty:'',price:''};drawPromos()});
    }
    drawImages(); drawPromos(); drawColors();
    $('#addImageRow').onclick=()=>{imageRows.push('');drawImages(); setTimeout(()=>$$('.pImageUrl',modalRoot).at(-1)?.focus(),30)};
    $('#addPromoRow').onclick=()=>{promoRows.push({qty:'',price:''});drawPromos(); setTimeout(()=>$$('.pPromoQty',modalRoot).at(-1)?.focus(),30)};
    $('#addColorRow').onclick=()=>{colorRows.push({name:'',qty:''});drawColors(); setTimeout(()=>$$('.pColorName',modalRoot).at(-1)?.focus(),30)};
    $$('[data-addcat]',modalRoot).forEach(b=>b.onclick=()=>{const inp=$('#pCats'); const tags=parseTags(inp.value); if(!tags.some(t=>t.toLowerCase()===b.dataset.addcat.toLowerCase())) tags.push(b.dataset.addcat); inp.value=tags.join(', ')});
    const readMoneyField=(selector)=>{const raw=String($(selector)?.value ?? '').trim().replace(',','.'); if(raw==='') return 0; const n=Number(raw); return Number.isFinite(n)?Math.max(0,n):0;};
    const readStockField=()=>Math.max(0,Math.floor(readMoneyField('#pStock')));
    const setAllColorRowsToZero=()=>{
      if(!colorRows.length) colorRows=[{name:'',qty:''}];
      colorRows=colorRows.map(r=>String(r.name||'').trim()?{...r,qty:0}:r);
      drawColors();
    };
    ['#pCost','#pPrice','#pStock'].forEach(sel=>{$(sel)?.addEventListener('input',e=>{
      const raw=String(e.target.value||'');
      if(raw!=='' && Number(raw)<0) e.target.value='0';
      if(sel==='#pStock' && raw!=='' && Math.floor(Number(raw)||0)===0) setAllColorRowsToZero();
      if(sel==='#pStock' && raw!=='' && Math.floor(Number(raw)||0)>0){
        const clean=mergeColorRows(colorRows).filter(r=>String(r.name||'').trim());
        if(clean.length && colorRowsTotal(clean)<=0){
          colorRows=[{name:'',qty:''}];
          drawColors();
        }
      }
    });});
    $('#autoDescBtn')&&($('#autoDescBtn').onclick=()=>{const temp={name:$('#pName')?.value||prod.name,id:$('#pId')?.value||prod.id,categories:$('#pCats')?.value||prod.categories,price:readMoneyField('#pPrice')}; $('#pDesc').value=autoProductDescription(temp); toast('Descripción automática generada.');});
    $('#markProductOut',modalRoot)?.addEventListener('click',()=>{
      const stockInput=$('#pStock',modalRoot);
      if(stockInput) stockInput.value='0';
      setAllColorRowsToZero();
      setProductSaveStatus('Producto marcado como AGOTADO. Toca “Guardar y sincronizar” para confirmarlo en Firebase.', 'info');
      toast('Stock en 0. Guarda para confirmar AGOTADO.');
    });
    let productSaving=false;
    function setProductSaveStatus(message,type='info'){
      const el=$('#productSaveStatus',modalRoot);
      if(!el) return;
      el.textContent=message || '';
      el.className='product-save-status '+(message?'active ':'')+(type||'info');
    }
    function setSaveButtonBusy(btn,busy,label){
      if(!btn) return;
      if(busy){
        btn.dataset.originalText=btn.dataset.originalText || btn.textContent || 'Guardar y sincronizar';
        btn.disabled=true;
        btn.classList.add('is-saving');
        btn.textContent=label || 'Guardando...';
      }else{
        btn.disabled=false;
        btn.classList.remove('is-saving');
        btn.textContent=btn.dataset.originalText || 'Guardar y sincronizar';
      }
    }
    $('#saveProduct').onclick=async()=>{
      const btn=$('#saveProduct',modalRoot);
      if(productSaving) return;
      productSaving=true;
      setSaveButtonBusy(btn,true,'Guardando...');
      setProductSaveStatus('Guardando producto en este dispositivo...', 'info');
      $$('.pImageUrl',modalRoot).forEach((inp,i)=>{if(!inp.readOnly) imageRows[i]=inp.value.trim();});
      const rawImages=imageRows.map(x=>String(x||'').trim()).filter(Boolean);
      setProductSaveStatus('Preparando imágenes...', 'info');
      const images=await compactProductImages(rawImages);
      const promos=$$('.promo-row',modalRoot).map(row=>{const q=$('.pPromoQty',row).value.trim(); const pr=$('.pPromoPrice',row).value.trim(); return q&&pr?`${q}=${pr}`:''}).filter(Boolean).join('\n');
      let colors=mergeColorRows(colorRows).filter(r=>String(r.name||'').trim());
      const manualStock=readStockField();
      if(manualStock>0 && colors.length && colorRowsTotal(colors)<=0) colors=[];
      const stockValue=colors.length?colorRowsTotal(colors):manualStock;
      const np=normalizeProductColorStock({id:$('#pId').value.trim()||nextCode(),name:$('#pName').value.trim()||'Producto sin nombre',categories:$('#pCats').value.trim(),cost:readMoneyField('#pCost'),price:readMoneyField('#pPrice'),stock:stockValue,colors,colores:colorRowsText(colors),image:images[0]||'',gallery:images.slice(1).join('\n'),promos,description:$('#pDesc').value.trim(),active:true,updatedAt:new Date().toISOString()});
      if(!np.description) np.description=autoProductDescription(np);
      try{
        const ix=state.products.findIndex(x=>x.id===id); if(ix>=0)state.products[ix]=np; else state.products.push(np); state.products=dedupeProducts(state.products); save(); SDCStore.saveBackup(state,'Producto guardado');
        setProductSaveStatus('Producto guardado en este dispositivo.', 'ok');
        closeModal(); render(); toast('✅ Producto guardado. Sincronizando Firebase en segundo plano...');
        saveProductToFirebase(np,id||np.id).then(()=>{
          state.settings.lastFirebaseSync=new Date().toISOString();
          state.settings.lastFirebaseSyncError='';
          const list=pendingFirebaseList().filter(x=>String(x?.id||'')!==String(np.id||''));
          state.settings.pendingFirebaseProducts=list;
          save();
          toast('✅ Producto confirmado en Firebase.');
        }).catch(err=>{
          console.warn('Firebase save pending',err);
          state.settings.lastFirebaseSyncError=firebaseErrorMessage(err);
          const pending=queueFirebaseProduct(np,id||np.id);
          toast(`Producto guardado localmente. Firebase pendiente (${pending}). Toca “Subir a Firebase” cuando tengas internet.`);
        });
      }catch(err){
        console.warn('Product local save failed',err);
        setProductSaveStatus('No se pudo guardar el producto: '+(err.message||err), 'error');
        toast('No se pudo guardar el producto. Revisa los datos.');
      }finally{
        productSaving=false;
        setSaveButtonBusy(btn,false);
      }
    };
    $('#duplicateProduct')&&( $('#duplicateProduct').onclick=async()=>{const cp={...prod,id:nextCode(),name:(prod.name||'Producto')+' copia',active:true}; state.products.push(cp); save(); let remoteOk=false; try{remoteOk=await saveProductToFirebase(cp)}catch(err){console.warn('Firebase duplicate failed',err)} closeModal(); render(); toast(remoteOk?'Producto duplicado en Firebase.':'Producto duplicado localmente.');});
    $('#deleteProduct')&&( $('#deleteProduct').onclick=async()=>{if(confirm('¿Eliminar este producto?')){state.products=state.products.filter(x=>x.id!==id);save(); let remoteOk=false; try{remoteOk=await archiveProductInFirebase(id)}catch(err){console.warn('Firebase archive failed',err)} closeModal();render();toast(remoteOk?'Producto ocultado en Firebase.':'Producto eliminado localmente.')}})
  }

  function productDetailHTML(p){
    const q=clientQty(p.id);
    const routeMode=productDeliveryMode(p.id);
    const productTotal=productItemsTotal(p,q);
    const normal=productNormalTotalQty(p,q);
    const cod=productCodTotalQty(p,q);
    const local=productLocalTotalQty(p,q);
    const st=status(p);
    const stockQty=productStock(p);
    const cost=Math.max(0,Number(p.cost||p.purchase||0));
    const invested=cost*stockQty;
    const gainUnit=Math.max(0,Number(p.price||0)-cost);
    const gainTotal=gainUnit*stockQty;
    const sellAll=Math.max(0,Number(p.price||0))*stockQty;
    const colorsHTML=colorStockHTML(p);
    const promo=promoLabelForMode(p,q,routeMode);
    const colorsShort=colorCompactText(p,5);
    return `<div class="modal-head v49-detail-head v141-detail-head v163-detail-head">
      <div class="v141-head-copy"><span class="sdc-safe-pill detail-pill hn-time-pill" id="hnLiveTime">${nowHNPanel()}</span><h3>${escapeHtml(p.name)}</h3><small>${escapeHtml(firstTag(p))} · ${escapeHtml(p.id||'')}</small></div>
      <button class="close">×</button>
    </div>
      <div class="modal-body v49-product-detail v141-product-detail v163-product-detail ${st.cls==='out'?'is-out':''}">
        <div class="v141-detail-shell v163-detail-shell">
          <section class="v49-detail-hero v141-detail-hero v163-detail-hero ${st.cls==='out'?'is-out':''}">
            <div class="v49-detail-image v141-detail-image v163-detail-image"><img src="${escapeHtml(productImage(p))}" alt="${escapeHtml(p.name)}" crossorigin="anonymous" onerror="this.onerror=null;this.src='${escapeHtml(placeholderFor(p))}'"><span class="stock-badge ${st.cls}"><i></i>${st.text}</span></div>
            <div class="v141-detail-mainwrap v163-detail-mainwrap">
              <div class="v49-detail-main v141-detail-main v163-detail-main">
                <small>${escapeHtml(firstTag(p))} · ${escapeHtml(p.id||'')}</small>
                <h4>${escapeHtml(p.name)}</h4>
                ${productClientFactsHTML(p,4)}
              </div>
              <div class="v141-price-box v163-price-box">
                <span>Precio</span>
                <b>${money(p.price)}</b>
                <small>${num(stockQty)} en stock${colorsShort?` · ${escapeHtml(colorsShort)}`:''}</small>
              </div>
            </div>
          </section>

          <div class="v141-meta-grid v163-meta-grid">
            <article><span>Stock total</span><b>${num(stockQty)}</b></article>
            <article><span>Categoría</span><b>${escapeHtml(firstTag(p)||'General')}</b></article>
            <article><span>Código</span><b>${escapeHtml(p.id||'SDC')}</b></article>
            <article><span>Estado</span><b class="v141-state ${st.cls}">${escapeHtml(st.text)}</b></article>
          </div>

          <div class="v49-tabbar v141-tabbar v163-tabbar" role="tablist">
            <button class="active" type="button" data-tab="cliente">CLIENTE</button>
            <button type="button" data-tab="admin">VENTAS</button>
            <button type="button" data-tab="captura">IMAGEN</button>
          </div>

          <section class="v49-tab active" data-panel="cliente">
            <div class="v250-detail-route-switch" role="tablist" aria-label="Ruta del cliente">
              <button type="button" class="${routeMode==='local'?'active':''}" data-v49-route="local" onclick="return window.sdcDetailSetRoute&&window.sdcDetailSetRoute(event,'local')">Comayagua</button>
              <button type="button" class="${routeMode==='hn'?'active':''}" data-v49-route="hn" onclick="return window.sdcDetailSetRoute&&window.sdcDetailSetRoute(event,'hn')">Honduras</button>
            </div>
            <div class="v250-detail-route-note" data-v49-route-note>${routeMode==='local'?'Precio local sin envío. La entrega en Comayagua se cobra según zona.':'En Honduras se muestra envío normal y pagar al recibir.'}</div>
            <div class="v49-qty-line v141-qty-line v163-qty-line v250-qty-line"><div class="v49-qty-wrap"><span>Cantidad</span><div class="v49-qty-stepper" role="group" aria-label="Cantidad del producto"><button type="button" id="v49QtyMinus" aria-label="Restar cantidad" onclick="return window.sdcDetailQty&&window.sdcDetailQty(event,-1)">−</button><b id="v49DetailQty" data-v49-qty-value="${q}">${num(q)}</b><button type="button" id="v49QtyPlus" aria-label="Sumar cantidad" onclick="return window.sdcDetailQty&&window.sdcDetailQty(event,1)">+</button></div></div>${promo?`<em data-v49-offer>🎁 ${escapeHtml(promo)}</em>`:`<em data-v49-offer style="display:none"></em>`}</div>
            <div class="v49-price-cards v141-price-cards v163-price-cards v164-sale-buttons v250-price-cards" data-v49-route-wrap="${routeMode}">
              <button type="button" class="v164-price-option ${routeMode==='local'?'is-main is-current':''}" data-v49-card="local" ${routeMode==='local'?'':'hidden aria-hidden="true"'}><span>Comayagua</span><b data-v49-total="local">${money(local)}</b><small>Precio local según su zona</small></button>
              <button type="button" class="v164-price-option ${routeMode==='hn'?'is-main is-current':''}" data-v49-card="normal" ${routeMode==='hn'?'':'hidden aria-hidden="true"'}><span>Envío normal</span><b data-v49-total="normal">${money(normal)}</b><small>Depósito / Tigo Money</small></button>
              <button type="button" class="v164-price-option" data-v49-card="cod" ${routeMode==='hn'?'':'hidden aria-hidden="true"'}><span>Envío pagar al recibir</span><b data-v49-total="cod">${money(cod)}</b><small>Envío + comisión 10%</small></button>
            </div>
            ${colorsHTML?`<div class="v86-color-client v141-color-card v163-color-card v164-color-card"><div class="v141-card-head"><b>Colores</b></div>${colorsHTML}</div>`:''}
          </section>

          <section class="v49-tab" data-panel="admin">
            <div class="v141-admin-top">
              ${colorsHTML?`<div class="v141-stock-hero"><div class="v141-stock-icon">🎨</div><div><span>Stock por color</span><b>${escapeHtml(defaultColorForProduct(p)||'General')}</b><small>${colorStockSummary(p,6) || `${num(stockQty)} disponible`}</small></div><strong>${num(stockQty)}</strong></div>`:''}
            </div>
            <div class="v49-admin-grid v141-admin-grid">
              <div><span>Stock total</span><b>${num(stockQty)}</b></div>
              <div><span>Invertido</span><b>${moneyPrivate(invested)}</b></div>
              <div><span>Ganancia c/u</span><b>${moneyPrivate(gainUnit)}</b></div>
              <div><span>Ganancia total</span><b>${moneyPrivate(gainTotal)}</b></div>
              <div class="full"><span>Si vende todo el stock</span><b>${money(sellAll)}</b></div>${colorsHTML?`<div class="full v141-admin-colors"><span>Stock por color</span>${colorsHTML}</div>`:''}
            </div>
          </section>

          <section class="v49-tab" data-panel="captura">
            <div class="v49-capture-note v141-capture-note v163-capture-note"><b>Imagen limpia para cliente</b><span>Diseño reducido: producto, precio, cantidad, stock, colores y oferta.</span></div>
            <div id="productShareCard">${productClientPhotoHTML(p,q)}</div>
            <div class="v49-capture-buttons v141-capture-buttons"><button class="btn full" type="button" id="v49DownloadProductPhoto">Generar PNG limpio</button><button class="btn secondary full" type="button" id="v49ShareProductPhotoTab">Compartir foto</button></div>
          </section>
        </div>
        <div class="modal-actions v49-detail-actions v141-detail-actions v163-detail-actions" style="position:static">
          <button class="btn v53-modal-quote" type="button" id="v49QuoteProduct">Añadir cotización</button>
          <button class="btn v53-modal-sell" type="button" id="v49SellProduct" ${st.cls==='out'?'disabled title="Producto agotado"':''}>${st.cls==='out'?'Agotado':'Añadir venta'}</button>
          <button class="btn v53-modal-whatsapp" type="button" id="v53WhatsAppProduct">WhatsApp</button>
          <button class="btn danger stockout-product-btn-v169" type="button" id="v169MarkOutProduct" ${productStock(p)<=0?'disabled title="Ya está agotado"':''}>Agotado</button>
          <button class="btn v53-modal-edit" type="button" id="v49EditProduct">Editar</button>
        </div>
      </div>`;
  }
  async function markExistingProductOut(id){
    const p=productById(id);
    if(!p) return toast('Producto no encontrado.');
    const rows=productColorRows(p);
    if(rows.length){
      p.colors=rows.map(r=>({...r,qty:0}));
      p.colores=colorRowsText(p.colors);
    }
    p.stock=0;
    p.active=true;
    save();
    closeModal();
    render();
    toast('Producto marcado como AGOTADO. Sincronizando Firebase...');
    try{
      await saveProductToFirebase(p,id);
      state.settings.lastFirebaseSync=new Date().toISOString();
      state.settings.lastFirebaseSyncError='';
      save();
      toast('✅ AGOTADO confirmado en Firebase.');
    }catch(err){
      console.warn('Firebase stockout pending',err);
      state.settings.lastFirebaseSyncError=firebaseErrorMessage(err);
      const pending=queueFirebaseProduct(p,id);
      save();
      toast(`Agotado guardado localmente. Firebase pendiente (${pending}).`);
    }
  }

  function bindProductDetails(p){
    let routeMode=productDeliveryMode(p.id);
    let lastActionKey='';
    let lastActionTime=0;
    const swallow=(ev)=>{ if(ev){ ev.preventDefault?.(); ev.stopPropagation?.(); ev.stopImmediatePropagation?.(); } };
    const runOnce=(ev,key,fn)=>{
      const now=Date.now();
      if(lastActionKey===key && now-lastActionTime<280){ swallow(ev); return false; }
      lastActionKey=key; lastActionTime=now;
      swallow(ev);
      fn();
      return false;
    };
    const qtyValue=()=>Math.max(1,Number($('#v49DetailQty',modalRoot)?.dataset.v49QtyValue)||clientQty(p.id)||1);
    const setQtyValue=(next)=>{
      const clean=Math.max(1,Math.min(999,Number(next)||1));
      const el=$('#v49DetailQty',modalRoot);
      if(el){el.dataset.v49QtyValue=String(clean); el.textContent=num(clean);}
      redrawTotals(clean);
    };
    const syncRouteUI=()=>{
      modalRoot.querySelectorAll('[data-v49-route]').forEach(btn=>{
        const active=btn.dataset.v49Route===routeMode;
        btn.classList.toggle('active',active);
        btn.setAttribute('aria-selected',active?'true':'false');
      });
      const currentCard = routeMode==='local' ? 'local' : 'normal';
      modalRoot.querySelectorAll('[data-v49-card]').forEach(card=>{
        const key=card.dataset.v49Card;
        const show = routeMode==='local' ? key==='local' : (key==='normal' || key==='cod');
        card.classList.toggle('is-current', key===currentCard);
        card.classList.toggle('is-visible', show);
        card.classList.toggle('is-hidden', !show);
        card.hidden=!show;
        card.style.setProperty('display', show ? 'grid' : 'none', 'important');
        if(show) card.removeAttribute('aria-hidden');
        else card.setAttribute('aria-hidden','true');
      });
      const wrap=modalRoot.querySelector('[data-v49-route-wrap]'); if(wrap) wrap.dataset.v49RouteWrap=routeMode;
      const note=modalRoot.querySelector('[data-v49-route-note]');
      if(note) note.textContent=routeMode==='local' ? 'Precio local sin envío. La entrega en Comayagua se cobra según zona.' : 'En Honduras se muestra envío normal y pagar al recibir.';
    };
    const redrawTotals=(forcedQty=null)=>{
      const q=Math.max(1,Number(forcedQty)||qtyValue());
      const el=$('#v49DetailQty',modalRoot);
      if(el){ el.dataset.v49QtyValue=String(q); el.textContent=num(q); }
      setClientQty(p.id,q);
      const local=productLocalTotalQty(p,q);
      const normal=productNormalTotalQty(p,q);
      const cod=productCodTotalQty(p,q);
      const offer=promoLabelForMode(p,q,routeMode);
      const set=(key,val)=>{const out=modalRoot.querySelector(`[data-v49-total="${key}"]`); if(out) out.textContent=val;};
      set('local',money(local)); set('normal',money(normal)); set('cod',money(cod));
      const offerEl=modalRoot.querySelector('[data-v49-offer]');
      if(offerEl){offerEl.textContent=offer?`🎁 ${offer}`:''; offerEl.style.display=offer?'inline-flex':'none';}
      syncRouteUI();
      const card=$('#productShareCard',modalRoot); if(card) card.innerHTML=productClientPhotoHTML(p,q);
    };
    const setRoute=(ev,mode)=>runOnce(ev,`route-${mode}`,()=>{
      routeMode=mode==='local'?'local':'hn';
      setProductDeliveryMode(p.id,routeMode);
      redrawTotals();
    });
    const addQty=(ev,delta)=>runOnce(ev,`qty-${delta}`,()=>setQtyValue(qtyValue()+Number(delta||0)));
    window.sdcDetailSetRoute=setRoute;
    window.sdcDetailQty=addQty;

    const detailModalEl = modalRoot.querySelector('.product-detail-modal-v221');
    const handleControls=(ev)=>{
      const routeBtn=ev.target.closest?.('[data-v49-route]');
      if(routeBtn) return setRoute(ev, routeBtn.dataset.v49Route);
      const minus=ev.target.closest?.('#v49QtyMinus');
      if(minus) return addQty(ev,-1);
      const plus=ev.target.closest?.('#v49QtyPlus');
      if(plus) return addQty(ev,1);
    };
    if(detailModalEl && !detailModalEl.dataset.v280Controls){
      detailModalEl.dataset.v280Controls='1';
      detailModalEl.addEventListener('click',handleControls,true);
      detailModalEl.addEventListener('touchend',handleControls,{capture:true,passive:false});
      detailModalEl.addEventListener('pointerup',handleControls,true);
    }

    $$('.v49-tabbar [data-tab]',modalRoot).forEach(btn=>btn.onclick=()=>{
      $$('.v49-tabbar [data-tab]',modalRoot).forEach(x=>x.classList.toggle('active',x===btn));
      $$('.v49-tab',modalRoot).forEach(panel=>panel.classList.toggle('active',panel.dataset.panel===btn.dataset.tab));
    });
    redrawTotals();
    const timeEl=$('#hnLiveTime',modalRoot);
    if(timeEl){
      const paintTime=()=>{ if(!document.body.contains(timeEl)){clearInterval(timeEl._timer); return;} timeEl.textContent=nowHNPanel(); };
      paintTime(); timeEl._timer=setInterval(paintTime,1000);
    }
    $('#v49DownloadProductPhoto',modalRoot)?.addEventListener('click',e=>downloadProductPhotoDirect(p.id,e.currentTarget));
    $('#v49ShareProductPhoto',modalRoot)?.addEventListener('click',()=>shareProductPhoto(p,qtyValue()));
    $('#v49ShareProductPhotoTab',modalRoot)?.addEventListener('click',()=>shareProductPhoto(p,qtyValue()));
    $('#v49QuoteProduct',modalRoot)?.addEventListener('click',()=>{closeModal();openQuote(p.id);});
    $('#v49SellProduct',modalRoot)?.addEventListener('click',()=>{if(productStock(p)<=0){toast('Producto agotado. Primero aumenta el stock en Editar.'); return;} closeModal();openSale(p.id);});
    $('#v53WhatsAppProduct',modalRoot)?.addEventListener('click',()=>sendProductWhatsApp(p,qtyValue()));
    $('#v169MarkOutProduct',modalRoot)?.addEventListener('click',()=>markExistingProductOut(p.id));
    $('#v49EditProduct',modalRoot)?.addEventListener('click',()=>{closeModal();openProductEditor(p.id);});
  }
  function openProductDetails(id){
    const p=productById(id);
    if(!p) return toast('Producto no encontrado.');
    openModal(productDetailHTML(p),true);
    bindProductDetails(p);
  }

  function productClientPhotoHTML(p, qty, imgOverride='', photoIndex=1, photoTotal=1){
    const q=Math.max(1,Number(qty||1));
    const total=productQuotedItemsTotal(p,q);
    const img=String(imgOverride||productImage(p)||'').trim();
    const st=status(p);
    const gift=p.gift || p.regalo || p.obsequio || '';
    const offer=promoLabelForQty(p,q);
    const stockQty=productStock(p);
    const colors=colorCompactText(p,5);
    const photoLabel=photoTotal>1?`<small class="productPhotoCount">Foto ${num(photoIndex)} de ${num(photoTotal)}</small>`:'';
    return `
      <div class="productPhotoClean productPhotoClean-v49 productPhotoClean-v498 productPhotoLandscape-v147 productPhotoClean-v163" data-export="product-photo-clean">
        <div class="productPhotoHead productPhotoHead-v147 productPhotoHead-v163"><img src="${exportLogoSrc()}" alt="SD Comayagua" loading="eager" decoding="sync"><div><strong>SD COMAYAGUA</strong><span>Producto disponible</span>${photoLabel}</div><b>${st.text}</b></div>
        <div class="productPhotoMain-v147 productPhotoMain-v163">
          <div class="productPhotoImageWrap productPhotoImageWrap-v147 productPhotoImageWrap-v163"><img src="${escapeHtml(img)}" crossorigin="anonymous" onerror="this.onerror=null;this.src='${escapeHtml(captureFallbackImage())}'"></div>
          <div class="productPhotoBody productPhotoBody-v147 productPhotoBody-v163">
            <span class="productPhotoCat-v163">${escapeHtml(firstTag(p)||'Producto')}</span>
            <h2>${escapeHtml(p.name)}</h2>
            <strong class="productPhotoPrice-v163">${money(productQuotedUnit(p))}</strong>
            ${gift?`<div class="gift-strip big">🎁 Regalo: ${escapeHtml(gift)}</div>`:''}
            <div class="productPhotoQty productPhotoQty-v163"><span>Cantidad consultada</span><b>${num(q)} ${q===1?'unidad':'unidades'} · ${money(total)}</b></div>
            <div class="productPhotoFacts-v163"><span>Stock <b>${num(stockQty)}</b></span>${colors?`<span>Colores <b>${escapeHtml(colors)}</b></span>`:''}${offer?`<span>Oferta <b>${escapeHtml(offer.replace('Oferta aplicada: ',''))}</b></span>`:''}</div>
            <div class="productPhotoNote productPhotoNote-v163">Precio sujeto a disponibilidad. Consulta por WhatsApp.</div>
          </div>
        </div>
        <div class="productPhotoFooter productPhotoFooter-v163">SD COMAYAGUA · WhatsApp +504 3151-7755</div>
      </div>`;
  }

  function waitImages(root,timeout=4500){
    const imgs=Array.from(root.querySelectorAll('img'));
    if(!imgs.length) return Promise.resolve();
    return Promise.all(imgs.map(img=>new Promise(resolve=>{
      if(img.complete) return resolve();
      const done=()=>resolve();
      const t=setTimeout(done,timeout);
      img.addEventListener('load',()=>{clearTimeout(t);done();},{once:true});
      img.addEventListener('error',()=>{clearTimeout(t);done();},{once:true});
    })));
  }
  function downloadBlob(blob,filename){
    const a=document.createElement('a');
    a.href=URL.createObjectURL(blob);
    a.download=filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(()=>URL.revokeObjectURL(a.href),1200);
  }
  function loadScriptOnce(src, globalName, timeout=10000){
    if(globalName && window[globalName]) return Promise.resolve(window[globalName]);
    const clean=String(src).split('?')[0];
    let existing=[...document.scripts].find(x=>String(x.src||'').includes(clean));
    if(!existing){
      existing=document.createElement('script');
      existing.src=src;
      existing.async=true;
      existing.defer=true;
      existing.dataset.sdcLazyLib='1';
      document.head.appendChild(existing);
    }
    return new Promise((resolve,reject)=>{
      const started=Date.now();
      const done=()=>{
        if(!globalName || window[globalName]) resolve(globalName?window[globalName]:true);
        else reject(new Error('No cargó '+globalName));
      };
      const tick=()=>{
        if(!globalName || window[globalName]) return done();
        if(Date.now()-started>timeout) return reject(new Error('Tiempo agotado cargando '+globalName));
        setTimeout(tick,120);
      };
      existing.addEventListener('load',done,{once:true});
      existing.addEventListener('error',()=>reject(new Error('No se pudo cargar '+src)),{once:true});
      tick();
    });
  }
  async function ensureHtml2Canvas(){
    if(window.html2canvas) return true;
    try{
      await loadScriptOnce('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js','html2canvas',12000);
      return !!window.html2canvas;
    }catch(err){
      console.warn('html2canvas lazy load falló',err);
      return false;
    }
  }
  async function ensureXLSX(){
    if(window.XLSX) return true;
    try{
      await loadScriptOnce('https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js','XLSX',14000);
      return !!window.XLSX;
    }catch(err){
      console.warn('XLSX lazy load falló',err);
      return false;
    }
  }
  function askClientPhone(){
    const typed=prompt('Número WhatsApp del cliente. Déjelo vacío para elegir el chat manualmente en WhatsApp:','');
    return typed===null?null:typed.trim();
  }
  function productWhatsAppText(p,qty=1){
    const q=Math.max(1,Number(qty)||1);
    const total=productQuotedItemsTotal(p,q);
    const normal=total+SHIPPING.normal.fee;
    const cod=codGrandTotal(total+SHIPPING.cod.fee);
    const offer=promoLabelForQty(p,q);
    const colors=colorCompactText(p,6);
    const stockQty=productStock(p);
    const colorLine=colors?`\n🎨 *Colores disponibles:* ${colors}`:'';
    const offerLine=offer?`\n🏷️ *Oferta disponible:* ${offer.replace('Oferta aplicada: ','')}`:'';
    return `✨ *PRODUCTO DISPONIBLE - SD COMAYAGUA*
━━━━━━━━━━━━━━━━━━━━

🛍️ *${p.name}*

💵 *Precio del producto:* ${money(productQuotedUnit(p))}
🔢 *Cantidad consultada:* ${num(q)}
🧾 *Subtotal:* *${money(total)}*
📦 *Stock disponible:* ${num(stockQty)}${colorLine}${offerLine}

🚚 *Opciones para recibir:*
1️⃣ *Depósito / Tigo Money:* ${money(normal)}
2️⃣ *Pagar al recibir:* ${money(cod)}
3️⃣ *Envío local:* ${LOCAL_PLACEHOLDER}

✅ *Importante:* precio y disponibilidad se confirman antes de cerrar el pedido.

🏪 *SD COMAYAGUA*
📲 WhatsApp: +504 3151-7755`;
  }


  function categorySnapshotTitle(){
    if(filter.special==='lowStock') return 'Productos en bajo stock';
    if(filter.special==='outStock') return 'Productos agotados';
    if(filter.special==='noImage') return 'Productos sin imagen';
    return filter.cat&&filter.cat!=='Todos'?filter.cat:'Catálogo disponible';
  }
  function categorySnapshotList(){
    const list=filteredProducts();
    if(filter.special==='outStock') return list;
    return list.filter(p=>productStock(p)>0);
  }
  function categorySnapshotSummary(list){
    const arr=list||[];
    const units=arr.reduce((a,p)=>a+productStock(p),0);
    const prices=arr.map(p=>productQuotedUnit(p)).filter(n=>n>0);
    const min=prices.length?Math.min(...prices):0;
    const max=prices.length?Math.max(...prices):0;
    return {units,min,max};
  }
  function categorySnapshotDisplayTitle(raw){
    const t=String(raw||'Catálogo disponible').trim();
    if(!t) return 'Catálogo disponible';
    if(t===t.toUpperCase() && /[A-ZÁÉÍÓÚÑ]/.test(t)) return t.toLowerCase().replace(/(^|[\s/.-])([a-záéíóúñ])/g,(m,p1,p2)=>p1+p2.toUpperCase());
    return t;
  }
  function categorySnapshotHTML(list,title){
    const source=list||[];
    const visible=source.slice(0,6);
    const hidden=Math.max(0,source.length-visible.length);
    const sum=categorySnapshotSummary(source);
    const prettyTitle=categorySnapshotDisplayTitle(title);
    const priceRange=sum.min&&sum.max?(sum.min===sum.max?money(sum.min):`Lps. ${num(sum.min)} – ${num(sum.max)}`):'Consultar';
    const gridModeClass=visible.length===1?' is-single':(visible.length===2?' is-centered':'');
    const rows=visible.map(p=>{
      const stockQty=productStock(p);
      const colors=colorCompactText(p,3);
      const offer=promoCompactText(p);
      const st=status(p);
      const statusLabel=st.cls==='out'?'Agotado':st.cls==='low'?'Pocas unidades':'Disponible';
      return `<article class="categoryShareItem-v199 ${st.cls==='out'?'is-out':''}">
        <div class="categorySharePhoto-v199">
          <img src="${escapeHtml(productImage(p))}" alt="${escapeHtml(p.name)}" crossorigin="anonymous" onerror="this.onerror=null;this.src='${escapeHtml(placeholderFor(p))}'">
          <span class="categoryShareStatus-v199 ${st.cls}">${escapeHtml(statusLabel)}</span>
        </div>
        <div class="categoryShareInfo-v199">
          <small>${escapeHtml(firstTag(p)||'Producto')} · ${escapeHtml(p.id||'SDC')}</small>
          <h3>${escapeHtml(p.name)}</h3>
          <div class="categorySharePriceRow-v199"><strong>${money(productQuotedUnit(p))}</strong><em>${num(stockQty)} disp.</em></div>
          <div class="categoryShareMeta-v199">${colors?`<span>🎨 ${escapeHtml(colors)}</span>`:''}${offer?`<span>🏷️ ${escapeHtml(offer)}</span>`:''}</div>
        </div>
      </article>`;
    }).join('') || `<div class="categoryShareEmpty-v199">Sin productos disponibles para mostrar.</div>`;
    return `<section class="categoryShareClean-v199" data-export="category-share-clean">
      <header class="categoryShareHead-v199">
        <div class="categoryShareBrand-v199">
          <img src="${exportLogoSrc()}" alt="SD Comayagua" loading="eager" decoding="sync">
          <div><span>SD COMAYAGUA</span><h2>${escapeHtml(prettyTitle)}</h2><p>Vista rápida para cliente · ${nowHNPanel()}</p></div>
        </div>
        <div class="categoryShareSummary-v199">
          <article><b>${num(source.length)}</b><span>Productos</span></article>
          <article><b>${num(sum.units)}</b><span>Unidades</span></article>
          <article class="wide"><b>${escapeHtml(priceRange)}</b><span>Rango de precios</span></article>
        </div>
      </header>
      <div class="categoryShareNotice-v199">Productos disponibles para cotizar. Precios sujetos a disponibilidad al momento de confirmar.</div>
      <div class="categoryShareGrid-v199${gridModeClass}">${rows}</div>
      ${hidden?`<div class="categoryShareMore-v199">+ ${num(hidden)} productos más disponibles en esta categoría</div>`:''}
      <footer class="categoryShareFooter-v199">
        <b>WhatsApp +504 3151-7755</b>
        <span>Envíos a domicilio · Depósito/Tigo Money · Pagar al recibir según zona</span>
      </footer>
    </section>`;
  }
  async function exportCategorySnapshot(mode='download'){
    const list=categorySnapshotList();
    if(!list.length) return toast('No hay productos disponibles en esta categoría para capturar.');
    const title=categorySnapshotTitle();
    const host=document.createElement('div');
    host.className='categoryShareExportHost-v199';
    document.body.appendChild(host);
    try{
      host.innerHTML=categorySnapshotHTML(list,title);
      await waitImages(host,6500);
      const node=host.querySelector('[data-export="category-share-clean"]');
      const blob=await captureNodeAsPngBlob(node,2.2);
      if(!blob) throw new Error('No se pudo crear la imagen.');
      const fileName=`categoria-${slugFile(title)}-${fileStamp()}.png`;
      const file=new File([blob],fileName,{type:'image/png'});
      if(mode==='share' && navigator.share && navigator.canShare && navigator.canShare({files:[file]})){
        await navigator.share({files:[file],title:`SD Comayagua · ${title}`,text:`${title} · ${num(list.length)} productos disponibles`});
        toast('Imagen de categoría lista para compartir.');
      }else{
        downloadBlob(blob,fileName);
        toast('Catálogo de categoría descargado en PNG.');
      }
    }catch(err){
      console.error(err);
      toast('No se pudo generar la captura. Intenta otra vez cuando carguen las fotos.');
    }finally{host.remove();}
  }
  function openCategoryPrintPreview(){
    const list=categorySnapshotList();
    if(!list.length) return toast('No hay productos disponibles en esta categoría para imprimir.');
    const title=categorySnapshotTitle();
    openModal(`<div class="modal-head category-print-head-v199"><div><small>Vista para cliente</small><h3>Catálogo por categoría</h3></div><button class="close">×</button></div><div class="modal-body categoryPrintModal-v199"><div class="categorySharePrint-v199">${categorySnapshotHTML(list,title)}</div><div class="modal-actions categoryPrintActions-v199" style="position:static"><button class="btn" id="downloadCategoryV163">Descargar PNG</button><button class="btn secondary" id="shareCategoryV199">Compartir</button><button class="btn ghost" id="printCategoryV163">Imprimir</button></div></div>`,true);
    $('#printCategoryV163',modalRoot)?.addEventListener('click',()=>window.print());
    $('#downloadCategoryV163',modalRoot)?.addEventListener('click',()=>exportCategorySnapshot('download'));
    $('#shareCategoryV199',modalRoot)?.addEventListener('click',()=>exportCategorySnapshot('share'));
  }

  async function captureNodeAsPngBlob(node, scale=3){
    const ok=await ensureHtml2Canvas();
    if(!ok) throw new Error('html2canvas no está disponible todavía.');
    const safeScale=isMobileDevice()?Math.min(Number(scale)||2,1.65):(Number(scale)||2);
    const canvas = await html2canvas(node, {
      scale:safeScale,
      backgroundColor: null,
      useCORS: true,
      allowTaint: false,
      logging: false,
      scrollX: 0,
      scrollY: 0,
      windowWidth: Math.max(document.documentElement.clientWidth, node.scrollWidth || 1200),
      windowHeight: Math.max(document.documentElement.clientHeight, node.scrollHeight || node.offsetHeight || 1600)
    });
    return await new Promise(resolve => canvas.toBlob(resolve, 'image/png', 0.98));
  }

  async function downloadProductPhotoDirect(id, btn){
    const p = productById(id);
    if(!p) return toast('Producto no encontrado.');
    const original = btn?.textContent || btn?.innerHTML;
    if(btn){ btn.disabled = true; btn.textContent = 'GENERANDO...'; }
    const images = galleryOf(p).slice(0,6);
    const safeImages = images.length ? images : [productImage(p)||captureFallbackImage()];
    const host = document.createElement('div');
    host.className = 'productPhotoExportHost';
    document.body.appendChild(host);
    try{
      let count=0;
      for(const [idx,imgSrc] of safeImages.entries()){
        host.innerHTML = productClientPhotoHTML(p, clientQty(p.id), imgSrc, idx+1, safeImages.length);
        await waitImages(host);
        const node = host.querySelector('[data-export="product-photo-clean"]');
        let blob = null;
        try{
          blob = await captureNodeAsPngBlob(node, 3);
        }catch(firstErr){
          console.warn('Primer intento de captura falló. Reintentando con imagen segura.', firstErr);
          host.querySelectorAll('.productPhotoImageWrap img').forEach(img=>img.src=captureFallbackImage());
          await waitImages(host);
          blob = await captureNodeAsPngBlob(node, 3);
        }
        if(blob){
          const suffix=safeImages.length>1?`-foto-${idx+1}`:'';
          const filename = `producto-${slugFile(p.name||p.id||'producto')}${suffix}-${fileStamp()}-${slugFile(p.id||'sdc')}.png`;
          downloadBlob(blob, filename);
          count++;
          await sleep(180);
        }
      }
      toast(count>1?`${count} fotos limpias descargadas.`:'PNG limpio descargado sin barra del navegador.');
    }catch(err){
      console.error(err);
      toast('No se pudo generar la foto del producto. Verifique que la librería html2canvas cargó.');
    }finally{
      host.remove();
      if(btn){ btn.disabled = false; btn.innerHTML = original || 'FOTO'; }
    }
  }

  async function productCardToBlob(){
    const el=$('#productShareCard',modalRoot);
    const blob=await captureNodeToBlob(el,'#07111f');
    if(!blob) toast('No se pudo generar la imagen. Revisa si la foto del producto terminó de cargar.');
    return blob;
  }

  async function downloadProductPhoto(p){const blob=await productCardToBlob(); if(!blob)return; const ref=prompt('Nombre o número del cliente para guardar esta imagen. Puedes dejarlo vacío:', state.settings.lastClientFileRef||''); if(ref===null)return; state.settings.lastClientFileRef=ref.trim(); save(); const label=slugFile(ref||p.name||p.id||'producto'); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=`producto-${label}-${fileStamp()}-${slugFile(p.id||'sdc')}.png`; a.click(); setTimeout(()=>URL.revokeObjectURL(a.href),1000); toast('Imagen del producto descargada con nombre único.');}
  async function shareProductPhoto(p,qty=1){
    const q=Math.max(1,Number(qty)||1);
    const text=productWhatsAppText(p,q);
    const ref=prompt('Número o nombre del cliente para nombrar la imagen. Déjelo vacío para compartir manual:', state.settings.lastClientFileRef||'');
    if(ref===null)return;
    state.settings.lastClientFileRef=ref.trim(); save();
    const images=galleryOf(p).slice(0,6);
    const safeImages=images.length?images:[productImage(p)||captureFallbackImage()];
    const host=document.createElement('div');
    host.className='productPhotoExportHost';
    document.body.appendChild(host);
    try{
      const files=[];
      for(const [idx,imgSrc] of safeImages.entries()){
        host.innerHTML=productClientPhotoHTML(p,q,imgSrc,idx+1,safeImages.length);
        await waitImages(host);
        const node=host.querySelector('[data-export="product-photo-clean"]');
        let blob=null;
        try{
          blob=await captureNodeAsPngBlob(node,3);
        }catch(firstErr){
          console.warn('No se pudo capturar con imagen externa. Usando respaldo.',firstErr);
          host.querySelectorAll('.productPhotoImageWrap img').forEach(img=>img.src=captureFallbackImage());
          await waitImages(host);
          blob=await captureNodeAsPngBlob(node,3);
        }
        if(blob){
          const suffix=safeImages.length>1?`-foto-${idx+1}`:'';
          const filename=`producto-${slugFile(ref||p.name||p.id||'producto')}${suffix}-${fileStamp()}-${slugFile(p.id||'sdc')}.png`;
          files.push(new File([blob],filename,{type:'image/png'}));
        }
      }
      if(files.length && navigator.canShare && navigator.canShare({files})){
        try{await navigator.share({files,text,title:'Producto SD Comayagua'}); toast(files.length>1?'Seleccione WhatsApp; se compartirán todas las fotos.':'Seleccione WhatsApp y el chat del cliente.'); return;}catch(e){if(e && e.name==='AbortError')return;}
      }
      if(files.length){
        files.forEach(file=>downloadBlob(file,file.name));
        toast(files.length>1?'Se descargaron las fotos para compartirlas por WhatsApp.':'La foto se descargó para compartirla por WhatsApp.');
      }else toast('No se pudo generar la foto del producto.');
    }catch(err){
      console.error(err);
      toast('No se pudo compartir la foto. Verifique que cargó html2canvas.');
    }finally{
      host.remove();
    }
  }
  function sendProductWhatsApp(p,qty=1){const phone=askClientPhone(); if(phone===null)return; openWhatsApp(phone,productWhatsAppText(p,qty));}

  function quoteModalHTML(isSale=false){
    const doc=isSale?saleDraft:quote;
    const editingSale=isSale && !!doc.editingId;
    const title=isSale?(editingSale?'Editar factura':'Venta / factura real'):'Cotización previa';
    const currentTitle=isSale?'Factura actual':'Cotización actual';
    const c=calc(doc);
    const itemCount=(doc.items||[]).reduce((acc,it)=>acc+Math.max(1,Number(it.qty)||1),0);
    const giftCount=(doc.gifts||[]).reduce((acc,it)=>acc+Math.max(1,Number(it.qty)||1),0);
    const countText=`${num(itemCount)} ${itemCount===1?'artículo':'artículos'}${giftCount?` · ${num(giftCount)} regalo${giftCount===1?'':'s'}`:''}`;
    const statusLabel=isSale?(editingSale?'Editando factura':'Factura'):'Cotización';
    const icons={
      receipt:'<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M7 3h10a2 2 0 0 1 2 2v16l-3-1.6-2 1.1-2-1.1-2 1.1-2-1.1L5 21V5a2 2 0 0 1 2-2Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M8.5 8h7M8.5 12h7M8.5 16h4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
      list:'<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M9 6h11M9 12h11M9 18h11" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M4 6h.01M4 12h.01M4 18h.01" stroke="currentColor" stroke-width="3.4" stroke-linecap="round"/></svg>',
      gift:'<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 10h16v10H4V10Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M12 10v10M3 7h18v3H3V7Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M12 7c-3.4 0-5-1.1-5-2.5C7 3.7 7.7 3 8.6 3c1.8 0 3.4 4 3.4 4Zm0 0c3.4 0 5-1.1 5-2.5 0-.8-.7-1.5-1.6-1.5C13.6 3 12 7 12 7Z" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
      user:'<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" stroke="currentColor" stroke-width="2"/><path d="M4.5 21a7.5 7.5 0 0 1 15 0" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
      box:'<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="m4 7.5 8 4.5 8-4.5M12 12v9" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>',
      eye:'<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" stroke="currentColor" stroke-width="2"/></svg>',
      save:'<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 4h12l2 2v14H5V4Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M8 4v6h8V4M8 20v-6h8v6" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>',
      invoice:'<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M7 3h10a2 2 0 0 1 2 2v16l-3-1.3-2 1.3-2-1.3-2 1.3-2-1.3L5 21V5a2 2 0 0 1 2-2Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M9 9h6M9 13h6M9 17h3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
      whatsapp:'<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4.4 19.6 5.6 16A8 8 0 1 1 8 18.4l-3.6 1.2Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M9 8.8c.5 3 2.2 4.7 5.2 5.2l1.1-1.4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
      image:'<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 5h16v14H4V5Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="m6.5 17 4.2-4.2 3 3 1.5-1.5L19 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M15.5 9.5h.01" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg>',
      short:'<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M7 3h10v18l-2-1-2 1-2-1-2 1-2-1V3Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M9.5 8h5M9.5 12h5M9.5 16h3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
      history:'<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 12a8 8 0 1 0 2.35-5.65L4 8.7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M4 4v4.7h4.7M12 7.5V12l3 2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
      clients:'<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M9 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM2.5 21a6.5 6.5 0 0 1 13 0" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M17 11a3 3 0 1 0 0-6M18 15c2.2.7 3.5 2.6 3.5 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
      back:'<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M10 7 5 12l5 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M5 12h10a4 4 0 0 1 4 4v1" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
      chevron:'<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m7 10 5 5 5-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
      check:'<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m5 12 4 4L19 6" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>'
    };
    const step=(jump,icon,label,active=false)=>`<button type="button" class="${active?'active':''}" data-jump="${jump}"><i aria-hidden="true">${icons[icon]}</i><span>${label}</span></button>`;
    const action=(cls,id,icon,label)=>`<button type="button" class="btn ${cls}" id="${id}" data-doc-action="${id}"><i class="sdc-action-icon-v176" aria-hidden="true">${icons[icon]}</i><span>${label}</span></button>`;
    const quoteActions=!isSale
      ? action('save-doc sdc-action-btn-v176 sdc-action-primary-v176 sdc-action-save-v176','saveQuote','save','Guardar')+
        action('main-wide to-sale sdc-action-btn-v176 sdc-action-blue-v176','toSale','invoice','Facturar')+
        action('secondary sdc-action-btn-v176 sdc-action-whatsapp-v176','waText','whatsapp','Enviar WhatsApp')+
        action('secondary sdc-action-btn-v176 sdc-action-image-v176','downloadDoc','image','Descargar imagen')+
        action('secondary sdc-action-btn-v176 sdc-action-receipt-v176','shortReceipt','short','Recibo corto')+
        action('secondary sdc-action-btn-v176 sdc-action-history-v176','openQuotes','history','Historial')+
        action('secondary sdc-action-btn-v176 sdc-action-clients-v176','openClientsFromDoc','clients','Clientes')+
        action('secondary sdc-action-btn-v176 sdc-action-back-v176','backToQuote','back','Volver')
      : action('main-wide sdc-action-btn-v176 sdc-action-blue-v176','finishSale','check',editingSale?'Guardar':'Finalizar')+
        action('secondary sdc-action-btn-v176 sdc-action-whatsapp-v176','waText','whatsapp','Enviar WhatsApp')+
        action('secondary sdc-action-btn-v176 sdc-action-image-v176','downloadDoc','image','Descargar imagen')+
        action('secondary sdc-action-btn-v176 sdc-action-receipt-v176','shortReceipt','short','Recibo corto')+
        action('secondary sdc-action-btn-v176 sdc-action-history-v176','printDoc','invoice','PDF')+
        action('secondary sdc-action-btn-v176 sdc-action-back-v176','backToQuote','back','Volver');
    return `<div class="modal-head quote-head quote-head-v176"><div class="quote-head-title-v176"><span class="quote-head-icon-v176">${icons.receipt}</span><div><h3>${title}</h3><span class="quote-status quote-status-v176"><span class="dot"></span>${statusLabel}</span></div></div><button class="close">×</button></div><div class="modal-body quote-body quote-body-v176"><div class="quote-jumpbar quote-steps-v176 no-print">${step('currentDocBox','list','Lista',true)}${step('giftCardBox','gift','Regalos')}${step('calcCardBox','user','Datos')}${step('pickerCardBox','box','Productos')}${step('docPreview','eye','Vista previa')}</div><div class="modal-grid quote-grid quote-grid-v153 quote-grid-v176"><div class="card-box current-card current-card-v176" id="currentDocBox"><div class="current-card-head current-card-head-v176"><span class="sdc-section-icon-v176">${icons.receipt}</span><div class="sdc-card-title-copy-v176"><h4 id="currentDocTitle">${currentTitle}</h4><small>${isSale?'Venta en curso':'Lista y total'}</small></div><span class="sdc-step-bubble-v176"><b>1</b><small>${isSale?'Factura':'Cotización'}</small></span></div><div class="quote-summary-strip-v176"><div class="quote-summary-cell-v176 quote-count-cell-v176"><span class="summary-cell-icon-v176">${icons.box}</span><b id="selectedCountPill" class="selected-count-pill selected-count-pill-v176">${countText}</b></div><div class="quote-summary-cell-v176 quote-products-cell-v176"><span>Productos</span><strong id="productsMini">${money(c.products)}</strong></div><button class="quote-summary-chevron-v176" type="button" data-jump="totalsMini" aria-label="Ver total">${icons.chevron}</button></div><div id="cartNotice" class="cart-notice hide"><b>✓ Artículo seleccionado</b></div><div id="cartList" class="cart-list cart-list-v176"></div><div id="totalsMini" class="totals-mini-v176"></div></div><div class="card-box span2 gift-card-box gift-card-box-v176" id="giftCardBox"><div class="gift-head gift-head-v176"><div class="gift-title-v176"><span class="sdc-section-icon-v176">${icons.gift}</span><div><h4>Regalos incluidos</h4><small>Bonos agregados</small></div></div><button class="btn secondary" type="button" id="toggleGiftPicker"><span>+ Incluir regalo</span></button></div><div id="giftPickerPanel" class="gift-picker-panel hide"><div class="searchbar"><span class="icon">⌕</span><input id="giftSearch" placeholder="Buscar producto para regalar..."></div><div id="giftPickerList" class="gift-picker-list"></div></div><div id="giftList" class="gift-list gift-list-v176"></div></div><div class="card-box calc-card calc-card-v176" id="calcCardBox"><div class="mini-section-head-v176"><span class="sdc-section-icon-v176">${icons.user}</span><h4>Datos para calcular</h4></div>${fieldsHTML(doc)}</div><div class="card-box span2 picker-card picker-card-v176" id="pickerCardBox"><div class="picker-head-compact picker-head-v176"><div class="mini-section-head-v176"><span class="sdc-section-icon-v176">${icons.box}</span><b>Seleccionar producto</b></div><span id="pickerCounter" class="found-pill">Todos los productos</span></div><div class="searchbar"><span class="icon">⌕</span><input id="pickSearch" placeholder="Buscar producto..."></div><div class="quote-picker-control-v200"><button type="button" class="quote-category-main-v200" id="togglePickCategories"><span>Elegir</span><b>Categoría</b></button><small>Los productos aparecen solo al elegir categoría o buscar.</small></div><div class="quote-category-list-v201" id="pickChips">${allCategories().map(c=>`<button type="button" class="quote-cat-card-v201" data-pickcat="${escapeHtml(c)}"><span>${escapeHtml(c==='Todos'?'Todos':c)}</span><b>${num(categoryCount(c))}</b><small>${c==='Todos'?'Todo el catálogo':'Ver categoría'}</small></button>`).join('')}</div><div id="pickerList" class="picker-list picker-list-v200"></div></div><div class="span2 preview-card preview-card-v176"><div id="docPreview">${docCard(doc,isSale)}</div></div></div><div class="modal-actions quote-actions quote-actions-v176 premium-actions compact-actions v47-actions v49-actions-clean v49-actions-readable v49-actions-textonly">${quoteActions}</div></div>`
  }
  function fieldsHTML(doc){
    const type=shippingKey(doc);
    const localHint=isLocalDoc(doc)?'<small class="field-hint">Envío local: escriba manualmente el cobro acordado con el cliente.</small>':'';
    return `<div class="modal-grid"><label><span class="label">Cliente opcional</span><input class="input bindDoc" data-k="client" value="${escapeHtml(doc.client)}"></label><label><span class="label">Teléfono cliente / WhatsApp</span><input class="input bindDoc" data-k="phone" inputmode="tel" value="${escapeHtml(doc.phone)}" placeholder="Sin +504 también funciona"></label><label><span class="label">Departamento</span><select class="select bindDoc" data-k="department">${SDC_DEPARTMENTS.map(d=>`<option ${doc.department===d?'selected':''}>${d}</option>`).join('')}</select></label><label><span class="label">Municipio</span><select class="select bindDoc" data-k="municipality"></select></label><label class="span2 quote-route-box-v250"><span class="label">Ruta rápida</span><div class="quote-route-switch-v250"><button type="button" class="${type==='local'?'active':''}" data-quote-route="local">Comayagua</button><button type="button" class="${type!=='local'?'active':''}" data-quote-route="hn">Honduras</button></div><small class="field-hint">Local deja el producto sin envío. Honduras trabaja con envío normal o pagar al recibir.</small></label><label class="span2"><span class="label">Referencia / barrio / colonia</span><input class="input bindDoc" data-k="reference" value="${escapeHtml(doc.reference)}"></label><label class="span2"><span class="label">Tipo de cobro / envío</span><select class="select bindDoc" data-k="shippingType"><option value="Normal" ${type==='normal'?'selected':''}>Depósito: Lps. 110</option><option value="COD" ${type==='cod'?'selected':''}>Envío Pagar al Recibir: Lps. 110 + comisión 10%</option><option value="Local" ${type==='local'?'selected':''}>Envío Local: Por definir</option></select>${localHint}</label><label><span class="label">Empresa / entrega</span><select class="select bindDoc" data-k="company"><option>Domicilio</option><option>Forza</option><option>C807</option><option>Cargo Expreso</option><option>Entrega local</option><option>Domicilio local</option><option>Retiro en tienda</option><option>Bus local</option></select></label><label><span class="label">Estado</span><select class="select bindDoc" data-k="status"><option>Cotizado</option><option>Esperando respuesta</option><option>Cliente interesado</option><option>Pendiente de pago</option><option>Vendido</option><option>Pagar al recibir</option><option>Entrega local</option><option>Cancelado</option></select></label><label><span class="label">Envío Lps.</span><input class="input bindDoc" data-k="shipping" type="number" value="${doc.shipping}" placeholder="${isLocalDoc(doc)?'Escriba el costo local':'Costo de envío'}">${localHint}</label><label><span class="label">Descuento Lps.</span><input class="input bindDoc" data-k="discount" type="number" value="${doc.discount}"></label></div>`
  }
  function bindDocFields(isSale){
    const doc=isSale?saleDraft:quote; if(!doc.shippingType) doc.shippingType=doc.cod?'COD':'Normal';
    const mun=$('[data-k="municipality"]',modalRoot);
    function fillMun(){const dep=$('[data-k="department"]',modalRoot).value; const list=SDC_MUNICIPALITIES[dep]||[]; mun.innerHTML=list.map(m=>`<option ${doc.municipality===m?'selected':''}>${m}</option>`).join('')+'<option>Otro municipio</option>'; if(!list.includes(doc.municipality)) mun.value=list[0]||'Otro municipio'; doc.department=dep; doc.municipality=mun.value}
    function syncShippingUI(force=false){const sel=$('[data-k="shippingType"]',modalRoot); if(!sel)return; applyShippingPreset(doc,sel.value,force); const ship=$('[data-k="shipping"]',modalRoot); if(ship) ship.value=Number(doc.shipping||0); const company=$('[data-k="company"]',modalRoot); if(company && Array.from(company.options).some(o=>o.value===doc.company)) company.value=doc.company;}
    fillMun(); const company=$('[data-k="company"]',modalRoot); if(company){company.value=doc.company||'Forza'; if(company.value!==doc.company && doc.company) company.insertAdjacentHTML('beforeend',`<option selected>${escapeHtml(doc.company)}</option>`)} if($('[data-k="status"]',modalRoot)) $('[data-k="status"]',modalRoot).value=doc.status||'Cotizado'; $('[data-k="shippingType"]',modalRoot).value=shippingKey(doc)==='cod'?'COD':shippingKey(doc)==='local'?'Local':'Normal'; syncShippingUI(false);
    const paintRouteButtons=()=>$$('[data-quote-route]',modalRoot).forEach(btn=>btn.classList.toggle('active', (btn.dataset.quoteRoute==='local')===isLocalDoc(doc)));
    paintRouteButtons();
    $$('[data-quote-route]',modalRoot).forEach(btn=>btn.onclick=()=>{
      const depSel=$('[data-k="department"]',modalRoot); const shipSel=$('[data-k="shippingType"]',modalRoot); const compSel=$('[data-k="company"]',modalRoot);
      if(btn.dataset.quoteRoute==='local'){
        doc.department='Comayagua';
        if(depSel) depSel.value='Comayagua';
        fillMun();
        doc.shippingType='Local';
        if(shipSel) shipSel.value='Local';
        syncShippingUI(true);
        doc.company='Entrega local';
        if(compSel) compSel.value='Entrega local';
      }else{
        doc.shippingType='Normal';
        if(shipSel) shipSel.value='Normal';
        syncShippingUI(true);
        if(doc.company==='Entrega local' || doc.company==='Domicilio local') doc.company='Forza';
        if(compSel) compSel.value=doc.company||'Forza';
      }
      paintRouteButtons();
      refreshQuoteUI(isSale);
      toast(btn.dataset.quoteRoute==='local'?'Modo Comayagua aplicado.':'Modo Honduras aplicado.');
    });
    $$('.bindDoc',modalRoot).forEach(el=>el.oninput=el.onchange=()=>{let v=el.value; if(el.dataset.k==='shipping'||el.dataset.k==='discount')v=+v||0; doc[el.dataset.k]=v; if(el.dataset.k==='phone') autoFillClientByPhone(doc,isSale); if(el.dataset.k==='department')fillMun(); if(el.dataset.k==='shippingType'){syncShippingUI(true); paintRouteButtons(); toast(`${shippingLabel(doc)} aplicado.`)} if(el.dataset.k==='shipping' && isLocalDoc(doc)) doc.shippingType='Local'; paintRouteButtons(); refreshQuoteUI(isSale);});
  }

  function renderPicker(isSale){
    const list=$('#pickerList',modalRoot);
    const counter=$('#pickerCounter',modalRoot);
    const chipsWrap=$('#pickChips',modalRoot);
    const toggleBtn=$('#togglePickCategories',modalRoot);
    let q='';
    let cat='';
    const localNorm=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
    function selectedLabel(){return cat?`Categoría: ${cat}`:'Elija categoría';}
    function showEmpty(title,text,countText=selectedLabel()){
      if(counter) counter.textContent=countText;
      if(!list) return;
      list.innerHTML=`<div class="picker-empty picker-empty-v200"><b>${escapeHtml(title)}</b><span>${escapeHtml(text)}</span></div>`;
    }
    function setActiveChip(){
      $$('[data-pickcat]',modalRoot).forEach(x=>x.classList.toggle('active',!!cat && localNorm(x.dataset.pickcat)===localNorm(cat)));
      if(toggleBtn){
        toggleBtn.classList.toggle('has-category',!!cat);
        toggleBtn.querySelector('b') && (toggleBtn.querySelector('b').textContent=cat||'Categoría');
      }
    }
    function draw(){
      setActiveChip();
      const term=localNorm(q);
      const rawTerm=(q||'').trim();
      const hasSearch=term.length>=2;
      if(!cat && !hasSearch){
        showEmpty('Seleccione una categoría','Los productos están ocultos para que el scroll sea corto. Toque “Categoría” y elija una sección, o busque por nombre/código con 2 letras.','Elija categoría');
        return;
      }
      if(rawTerm.length>0 && rawTerm.length<2 && !cat){
        showEmpty('Buscador listo','Escriba al menos 2 letras para buscar en todo el inventario, o toque una categoría.','Escriba 2 letras');
        return;
      }
      const catKey=localNorm(cat);
      const allItems=activeProducts().filter(p=>{
        const okCat=!cat || catKey==='todos' || productTags(p).map(localNorm).includes(catKey);
        const searchable=[p.name,p.id,categoryText(p),p.category,p.categoria,p.etiquetas].join(' ');
        const okSearch=!hasSearch || localNorm(searchable).includes(term);
        return okCat && okSearch;
      });
      const pickerLimit=isMobileDevice()?18:60;
      const items=allItems.slice(0,pickerLimit);
      if(counter) counter.textContent=allItems.length ? `${allItems.length} visibles` : 'Sin resultados';
      const limitNote=allItems.length>items.length?`<div class="picker-limit-note picker-limit-note-v200">Mostrando ${items.length} de ${allItems.length}. Use el buscador para encontrar más rápido.</div>`:'';
      list.innerHTML=(items.map(p=>`<div class="picker-item picker-item-v200"><img loading="lazy" decoding="async" src="${escapeHtml(productImage(p))}" onerror="this.onerror=null;this.src='${escapeHtml(placeholderFor(p))}'"><div><b>${escapeHtml(p.name)}</b><span>${money(productQuotedUnit(p))} · Stock ${num(productStock(p))}${colorStockSummary(p,2)?` · ${escapeHtml(colorStockSummary(p,2))}`:''} · ${escapeHtml(firstTag(p))}</span></div><button class="btn small add-pick-btn" type="button" data-additem="${escapeHtml(p.id)}">Añadir</button></div>`).join('')+limitNote)||'<div class="picker-empty"><b>Sin productos para mostrar</b><span>Pruebe otra categoría o revise el texto de búsqueda.</span></div>';
      $$('[data-additem]',list).forEach(b=>b.onclick=()=>addDocItem(b.dataset.additem,isSale,b));
    }
    const pickSearchEl=$('#pickSearch',modalRoot);
    if(pickSearchEl){
      pickSearchEl.oninput=e=>{
        q=e.target.value;
        clearTimeout(pickSearchEl._sdcPickTimer);
        pickSearchEl._sdcPickTimer=setTimeout(draw,isMobileDevice()?130:40);
      };
    }
    if(toggleBtn && chipsWrap){
      toggleBtn.onclick=()=>chipsWrap.classList.toggle('is-open');
    }
    $$('[data-pickcat]',modalRoot).forEach(b=>{
      b.classList.remove('active');
      b.onclick=()=>{
        const next=b.dataset.pickcat || 'Todos';
        if(cat && localNorm(cat)===localNorm(next)){
          cat='';
          if(chipsWrap) chipsWrap.classList.remove('is-open');
          draw();
          return;
        }
        cat=next;
        if(chipsWrap) chipsWrap.classList.remove('is-open');
        draw();
      };
    });
    draw();
  }
  function addDocItem(id,isSale,triggerBtn=null){
    const p=productById(id); if(!p)return;
    const doc=isSale?saleDraft:quote;
    const color=defaultColorForProduct(p);
    const found=doc.items.find(x=>x.id===id && colorKey(selectedColorLabel(x))===colorKey(color));
    if(found)found.qty++; else doc.items.push({id:p.id,name:p.name,price:+p.price||0,cost:+p.cost||0,qty:1,color,image:productImage(p)});
    refreshQuoteUI(isSale);
    const qty=found?found.qty:1;
    const notice=$('#cartNotice',modalRoot);
    if(notice){notice.classList.remove('hide'); notice.innerHTML=`<b>✓ Artículo seleccionado</b><span>${escapeHtml(p.name)}${color?` · ${escapeHtml(color)}`:''} · cantidad ${num(qty)}</span>`; clearTimeout(window.__sdcCartNoticeTimer); window.__sdcCartNoticeTimer=setTimeout(()=>notice.classList.add('hide'),3000);}
    if(triggerBtn){
      const card=triggerBtn.closest('.picker-item');
      if(card){
        card.classList.add('is-selected');
        clearTimeout(card._pickedTimer);
        card._pickedTimer=setTimeout(()=>card.classList.remove('is-selected'),1400);
      }
      const original=triggerBtn.dataset.originalLabel || triggerBtn.textContent;
      triggerBtn.dataset.originalLabel=original;
      triggerBtn.textContent='✓ Seleccionado';
      triggerBtn.disabled=true;
      clearTimeout(triggerBtn._pickedTimer);
      triggerBtn._pickedTimer=setTimeout(()=>{triggerBtn.disabled=false; triggerBtn.textContent=original;},950);
    }
    toast(`${p.name}${color?` (${color})`:''} agregado a ${isSale?'factura':'cotización'}. Use Ver lista cuando quiera revisar.`);
  }

  function giftItemHTML(it,i){
    const qty=Math.max(1,Number(it.qty)||1);
    const p=itemProductRef(it);
    const rows=productColorRows(p).filter(r=>Number(r.qty)>0 || colorKey(r.name)===colorKey(selectedColorLabel(it)));
    if(rows.length && !selectedColorLabel(it)) it.color=defaultColorForProduct(p);
    const current=selectedColorLabel(it);
    const colorSelect=rows.length?`<label class="cart-color-select-v86 gift-color"><span>Color</span><select data-gift-color="${i}">${rows.map(r=>`<option value="${escapeHtml(r.name)}" ${colorKey(current)===colorKey(r.name)?'selected':''}>${escapeHtml(r.name)} · ${num(r.qty)}</option>`).join('')}</select></label>`:'';
    const available=current?`<small class="color-available-v86">Disponible ${escapeHtml(current)}: ${num(colorQtyAvailable(p,current))}</small>`:'';
    return `<div class="cart-row cart-row-v24 gift-row"><div class="cart-info"><b>🎁 ${escapeHtml(it.name)}${current?` <em class="item-color-pill-v86">${escapeHtml(current)}</em>`:''}</b><span>Regalo · Stock actual ${num(productStock(p))}</span>${colorSelect}${available}</div><div class="qtybox"><button data-gift-dec="${i}">−</button><input data-gift-qty="${i}" type="number" value="${qty}"><button data-gift-inc="${i}">+</button></div><button class="btn small danger remove-item" data-gift-rem="${i}">Quitar</button></div>`;
  }
  function addGiftItem(id,isSale){
    const p=productById(id); if(!p)return;
    const doc=isSale?saleDraft:quote; doc.gifts=Array.isArray(doc.gifts)?doc.gifts:[];
    const color=defaultColorForProduct(p);
    const found=doc.gifts.find(x=>x.id===id && colorKey(selectedColorLabel(x))===colorKey(color));
    if(found) found.qty=Math.max(1,(+found.qty||1)+1);
    else doc.gifts.push({id:p.id,name:p.name,price:0,cost:+p.cost||0,qty:1,color,image:productImage(p)});
    refreshQuoteUI(isSale);
    toast(`${p.name}${color?` (${color})`:''} agregado como regalo.`);
  }
  function bindGiftPicker(isSale){
    const btn=$('#toggleGiftPicker',modalRoot); const panel=$('#giftPickerPanel',modalRoot); const input=$('#giftSearch',modalRoot); const list=$('#giftPickerList',modalRoot);
    if(!btn || !panel || !input || !list) return;
    function draw(){
      const term=String(input.value||'').toLowerCase().trim();
      const items=activeProducts().filter(p=>!term || [p.name,p.id,categoryText(p)].join(' ').toLowerCase().includes(term)).slice(0,isMobileDevice()?18:36);
      list.innerHTML=items.map(p=>`<div class="picker-item gift-pick-item"><img loading="lazy" decoding="async" src="${escapeHtml(productImage(p))}" onerror="this.onerror=null;this.src='${escapeHtml(placeholderFor(p))}'"><div><b>${escapeHtml(p.name)}</b><span>Stock ${num(productStock(p))}${colorStockSummary(p,2)?` · ${escapeHtml(colorStockSummary(p,2))}`:''} · ${escapeHtml(firstTag(p))}</span></div><button class="btn small add-pick-btn" type="button" data-giftadd="${escapeHtml(p.id)}">Regalar</button></div>`).join('') || '<div class="picker-empty"><b>Sin productos</b><span>Escriba otro nombre o código.</span></div>';
      $$('[data-giftadd]',list).forEach(b=>b.onclick=()=>addGiftItem(b.dataset.giftadd,isSale));
    }
    btn.onclick=()=>{panel.classList.toggle('hide'); if(!panel.classList.contains('hide')){draw(); setTimeout(()=>input.focus({preventScroll:true}),60);}};
    input.oninput=draw;
  }

  function cartItemHTML(it,i){
    const qty=Math.max(1,Number(it.qty)||1);
    const total=itemTotal(it);
    const unit=total/qty;
    const p=itemProductRef(it);
    const rows=productColorRows(p).filter(r=>Number(r.qty)>0 || colorKey(r.name)===colorKey(selectedColorLabel(it)));
    if(rows.length && !selectedColorLabel(it)) it.color=defaultColorForProduct(p);
    const current=selectedColorLabel(it);
    const promo=promoTotalForQty(p,qty)!==null;
    const promoTxt=promo?`<small class="promo-applied">${escapeHtml(promoLabelForQty(p,qty)||'Oferta aplicada')}</small>`:'';
    const colorSelect=rows.length?`<label class="cart-color-select-v86"><span>Color</span><select data-color="${i}">${rows.map(r=>`<option value="${escapeHtml(r.name)}" ${colorKey(current)===colorKey(r.name)?'selected':''}>${escapeHtml(r.name)} · ${num(r.qty)}</option>`).join('')}</select></label>`:'';
    const available=current?`<small class="color-available-v86">Disponible ${escapeHtml(current)}: ${num(colorQtyAvailable(p,current))}</small>`:'';
    return `<div class="cart-row cart-row-v24"><div class="cart-info"><b>${escapeHtml(it.name)}${current?` <em class="item-color-pill-v86">${escapeHtml(current)}</em>`:''}</b><span>${money(unit)} c/u · <strong class="cart-item-total-v219">Total ${money(total)}</strong></span>${colorSelect}${available}${promoTxt}</div><div class="qtybox"><button data-dec="${i}">−</button><input data-qty="${i}" type="number" value="${qty}"><button data-inc="${i}">+</button></div><button class="btn small danger remove-item" data-rem="${i}">Quitar</button></div>`;
  }
  function getQuoteSig(doc){
    const items=(doc.items||[]).map(it=>[it.id,Math.max(1,Number(it.qty)||1),selectedColorLabel(it),Number(it.price||0)].join(':')).join('|');
    const gifts=(doc.gifts||[]).map(it=>[it.id,Math.max(1,Number(it.qty)||1),selectedColorLabel(it)].join(':')).join('|');
    return [items,gifts,doc.shipping,doc.discount,shippingKey(doc),doc.client,doc.phone,doc.department,doc.municipality,doc.reference].join('::');
  }
  function renderDocPreviewNow(isSale){
    const preview=$('#docPreview',modalRoot);
    if(!preview) return;
    clearTimeout(window.__sdcDocPreviewTimer);
    const fresh=currentDoc(isSale);
    const freshSig=getQuoteSig(fresh);
    preview.dataset.previewRequested='1';
    preview.innerHTML=docCard(fresh,isSale);
    preview.dataset.sig=freshSig;
    preview.dataset.pendingSig='';
    preview.querySelectorAll('img').forEach(img=>{try{img.loading='lazy'; img.decoding='async';}catch(e){}});
  }
  function scheduleDocPreview(doc,isSale,delay=260){
    const target=$('#docPreview',modalRoot);
    if(!target) return;
    const sig=getQuoteSig(doc);
    clearTimeout(window.__sdcDocPreviewTimer);
    if(isMobileDevice() && target.dataset.previewRequested!=='1'){
      target.dataset.sig='';
      target.dataset.pendingSig=sig;
      if(!target.querySelector('[data-show-doc-preview]')){
        target.innerHTML='<div class="doc-preview-loading doc-preview-light-v306"><b>Vista previa pausada</b><span>Para que Cotizar sea más rápido en celular, la factura visual se carga solo cuando la necesites.</span><button type="button" class="btn secondary" data-show-doc-preview="1">Ver vista previa</button></div>';
      }
      return;
    }
    if(target.dataset.sig===sig && target.innerHTML.trim()) return;
    target.dataset.pendingSig=sig;
    if(!target.innerHTML.trim() || target.querySelector('[data-show-doc-preview]')){
      target.innerHTML='<div class="doc-preview-loading"><b>Preparando vista previa...</b><span>La cotización sigue funcionando rápido mientras se actualiza.</span></div>';
    }
    window.__sdcDocPreviewTimer=setTimeout(()=>{
      renderDocPreviewNow(isSale);
    },delay);
  }
  function refreshQuoteUI(isSale){
    const doc=isSale?saleDraft:quote; doc.gifts=Array.isArray(doc.gifts)?doc.gifts:[];
    const cart=$('#cartList',modalRoot);
    if(cart) cart.innerHTML=doc.items.length?doc.items.map((it,i)=>cartItemHTML(it,i)).join(''):'<div class="empty-state">Agrega productos para calcular.</div>';
    const giftList=$('#giftList',modalRoot); if(giftList) giftList.innerHTML=doc.gifts.length?doc.gifts.map((it,i)=>giftItemHTML(it,i)).join(''):'<div class="empty-state gift-empty">Sin regalos incluidos.</div>';
    const c=calc(doc);
    const productsMini=$('#productsMini',modalRoot); if(productsMini) productsMini.textContent=money(c.products);
    const totalsMini=$('#totalsMini',modalRoot); if(totalsMini) totalsMini.innerHTML=`<div class="summary"><div class="summary-row"><b>Productos</b><b>${money(c.products)}</b></div><div class="summary-row"><b>Envío</b><b>${money(c.shipping)}</b></div><div class="summary-row"><b>Comisión</b><b>${money(c.commission)}</b></div><div class="summary-total"><b>Total</b><b>${money(c.total)}</b></div></div>`;
    scheduleDocPreview(doc,isSale, isMobileDevice()?320:180);
    const itemsCount=(doc.items||[]).reduce((acc,it)=>acc+Math.max(1,Number(it.qty)||1),0);
    const giftsCount=(doc.gifts||[]).reduce((acc,it)=>acc+Math.max(1,Number(it.qty)||1),0);
    const pill=$('#selectedCountPill',modalRoot); if(pill) pill.textContent=`${num(itemsCount)} ${itemsCount===1?'artículo':'artículos'}${giftsCount?` · ${num(giftsCount)} regalo${giftsCount===1?'':'s'}`:''}`;
    const title=$('#currentDocTitle',modalRoot); if(title) title.textContent=`${isSale?'Factura':'Cotización'} actual`;
    $$('[data-inc]',modalRoot).forEach(b=>b.onclick=()=>{doc.items[+b.dataset.inc].qty++;refreshQuoteUI(isSale)});
    $$('[data-dec]',modalRoot).forEach(b=>b.onclick=()=>{const it=doc.items[+b.dataset.dec]; it.qty=Math.max(1,it.qty-1);refreshQuoteUI(isSale)});
    $$('[data-rem]',modalRoot).forEach(b=>b.onclick=()=>{doc.items.splice(+b.dataset.rem,1);refreshQuoteUI(isSale)});
    $$('[data-qty]',modalRoot).forEach(inp=>inp.oninput=()=>{doc.items[+inp.dataset.qty].qty=Math.max(1,+inp.value||1);clearTimeout(inp._qtyT);inp._qtyT=setTimeout(()=>refreshQuoteUI(isSale),170)});
    $$('[data-color]',modalRoot).forEach(sel=>sel.onchange=()=>{const it=doc.items[+sel.dataset.color]; if(it){it.color=sel.value; refreshQuoteUI(isSale);}});
    $$('[data-gift-inc]',modalRoot).forEach(b=>b.onclick=()=>{doc.gifts[+b.dataset.giftInc].qty=Math.max(1,(+doc.gifts[+b.dataset.giftInc].qty||1)+1);refreshQuoteUI(isSale)});
    $$('[data-gift-dec]',modalRoot).forEach(b=>b.onclick=()=>{const it=doc.gifts[+b.dataset.giftDec]; it.qty=Math.max(1,(+it.qty||1)-1);refreshQuoteUI(isSale)});
    $$('[data-gift-rem]',modalRoot).forEach(b=>b.onclick=()=>{doc.gifts.splice(+b.dataset.giftRem,1);refreshQuoteUI(isSale)});
    $$('[data-gift-qty]',modalRoot).forEach(inp=>inp.oninput=()=>{doc.gifts[+inp.dataset.giftQty].qty=Math.max(1,+inp.value||1);clearTimeout(inp._qtyT);inp._qtyT=setTimeout(()=>refreshQuoteUI(isSale),170)});
    $$('[data-gift-color]',modalRoot).forEach(sel=>sel.onchange=()=>{const it=doc.gifts[+sel.dataset.giftColor]; if(it){it.color=sel.value; refreshQuoteUI(isSale);}});
  }
  function openQuote(id){currentView='quote'; if(!quote.items.length) quote=emptyQuote(); if(id)addDocItemTo(quote,id,clientQty(id)); openModal(quoteModalHTML(false),true); bindQuoteCommon(false); }
  function openSale(id,fromDoc=null){saleDraft=fromDoc?SDCStore.clone(fromDoc):emptySale(); saleDraft.id='SDC-'+Date.now().toString().slice(-10); saleDraft.kind='receipt'; saleDraft.status=isCodDoc(saleDraft)?'Pagar al recibir':isLocalDoc(saleDraft)?'Entrega local':'Vendido'; delete saleDraft.saved; delete saleDraft.editingId; if(id)addDocItemTo(saleDraft,id,clientQty(id)); openModal(quoteModalHTML(true),true); bindQuoteCommon(true); }
  function addDocItemTo(doc,id,qty=1){const p=productById(id); if(!p)return; const cleanQty=Math.max(1,Number(qty)||1); const color=defaultColorForProduct(p); const found=doc.items.find(x=>x.id===id && colorKey(selectedColorLabel(x))===colorKey(color)); if(found)found.qty=Math.max(1,Number(found.qty)||1)+cleanQty; else doc.items.push({id:p.id,name:p.name,price:+p.price||0,cost:+p.cost||0,qty:cleanQty,color,image:productImage(p)});}
  function bindQuoteCommon(isSale){
    renderPicker(isSale); bindDocFields(isSale); refreshQuoteUI(isSale); bindGiftPicker(isSale);
    const bindAction=(id,fn)=>{const el=$('#'+id,modalRoot); if(el) el.onclick=(ev)=>{ev&&ev.preventDefault&&ev.preventDefault(); ev&&ev.stopPropagation&&ev.stopPropagation(); fn();};};
    $$('[data-jump]',modalRoot).forEach(b=>b.onclick=()=>{if(b.dataset.jump==='docPreview') renderDocPreviewNow(isSale); $('#'+b.dataset.jump,modalRoot)?.scrollIntoView({behavior:'smooth',block:'start'});});
    const preview=$('#docPreview',modalRoot);
    if(preview) preview.onclick=(ev)=>{if(ev.target.closest('[data-show-doc-preview]')){ev.preventDefault(); renderDocPreviewNow(isSale);}};
    bindAction('backToQuote',()=>{$('#currentDocTitle',modalRoot)?.scrollIntoView({behavior:'smooth',block:'start'}); toast('La cotización sigue abierta.');});
    bindAction('downloadDoc',()=>downloadDocImage(isSale?'recibo':'cotizacion'));
    bindAction('shortReceipt',()=>openShortReceipt(isSale));
    bindAction('waText',()=>sendWhatsAppText(isSale));
    bindAction('waPhoto',()=>shareDocPhoto(isSale));
    bindAction('sendCompleteQuote',sendCompleteQuote);
    bindAction('openClientsFromDoc',()=>openClients(isSale?'sale':'quote'));
    bindAction('printDoc',()=>printDocumentCard(isSale));
    bindAction('saveQuote',saveCurrentQuote);
    bindAction('openQuotes',openSavedQuotes);
    bindAction('toSale',()=>{if(!quote.items.length)return toast('Agrega productos antes de pasar a venta.'); closeModal(); openSale(null,quote)});
    bindAction('finishSale',finishSale);
  }
  function saveCurrentQuote(){
    if(!quote.items.length)return toast('Agrega productos antes de guardar.');
    quote.date=new Date().toISOString(); quote.saved=true;
    const clean=SDCStore.clone(quote); delete clean.editingId; clean.kind='quote'; clean.total=calc(clean).total;
    const key=quote.editingId||quote.id;
    const ix=state.quotes.findIndex(q=>q.id===key || q.id===clean.id);
    if(ix>=0) state.quotes[ix]=clean; else state.quotes.unshift(clean);
    quote=SDCStore.clone(clean); quote.editingId=clean.id; state.lastQuote=SDCStore.clone(clean);
    saveClientFromDoc(clean);
    save(); SDCStore.saveBackup(state,'Cotización guardada');
    saveDocumentToFirebase(clean,'quote').catch(err=>console.warn('No se guardó la cotización en Firebase',err));
    toast(ix>=0?'Cotización actualizada.':'Cotización guardada.');
  }
  function docCard(doc,isSale){
    const c=calc(doc);
    const code=doc.id||'SDC';
    const dateObj=new Date(doc.date||Date.now());
    const date=dateObj.toLocaleString('es-HN',{day:'2-digit',month:'short',year:'numeric',hour:'numeric',minute:'2-digit'});
    const dateOnly=dateObj.toLocaleDateString('es-HN',{day:'2-digit',month:'short',year:'numeric'});
    const timeOnly=dateObj.toLocaleTimeString('es-HN',{hour:'numeric',minute:'2-digit'});
    const itemCount=(doc.items||[]).reduce((a,it)=>a+Math.max(1,Number(it.qty)||1),0);
    const giftCount=(doc.gifts||[]).reduce((a,it)=>a+Math.max(1,Number(it.qty)||1),0);
    const titleText=isSale?'RECIBO DE COMPRA':'COTIZACIÓN SD COMAYAGUA';
    const headerTitle=isSale?'Recibo de compra':'Cotización formal';
    const statusText=isSale?'VENTA CONFIRMADA':'COTIZACIÓN VIGENTE';
    const productTitle=isSale?'Productos vendidos':'Productos cotizados';
    const paymentTitle=shippingLabel(doc);
    const process=shippingNote(doc);
    const clientName=String(doc.client||'').trim()||'Cliente no registrado';
    const phone=String(doc.phone||'').trim()||'No registrado';
    const location=[doc.department,doc.municipality].filter(Boolean).join(' / ')||'No seleccionada';
    const delivery=String(doc.company||'').trim()||'No seleccionada';
    const rows=(doc.items||[]).map((it,i)=>{
      const qty=Math.max(1,Number(it.qty)||1);
      const total=itemTotal(it);
      const unit=total/qty;
      const p=itemProductRef(it);
      const promo=promoTotalForQty(p,qty)!==null;
      const realImg=(galleryOf(p)[0]||it.image||'').trim();
      const initials=escapeHtml((it.name||'SD').slice(0,2).toUpperCase());
      const thumb=realImg?`<img class="receipt-item-thumb" src="${escapeHtml(realImg)}" alt="${escapeHtml(it.name)}" loading="eager" crossorigin="anonymous" referrerpolicy="no-referrer" onerror="this.replaceWith(Object.assign(document.createElement('div'),{className:'receipt-item-thumb receipt-thumb-fallback',textContent:'${initials}'}))">`:`<div class="receipt-item-thumb receipt-thumb-fallback">${initials}</div>`;
      const color=itemColorText(it);
      return `<div class="receipt-item-pro has-thumb v141-receipt-item">
        <div class="receipt-item-index">${i+1}</div>
        ${thumb}
        <div class="receipt-item-info">
          <b>${escapeHtml(it.name)}</b>
          <span>${num(qty)} ${qty===1?'unidad':'unidades'} · ${money(unit)} c/u${promo?' · Oferta aplicada':''}</span>
          ${color?`<small>${escapeHtml(color)}</small>`:''}
        </div>
        <strong>${money(total)}</strong>
      </div>`;
    }).join('')||'<div class="receipt-empty-pro">Sin productos agregados</div>';
    const giftRows=(doc.gifts||[]).map((it,i)=>{
      const qty=Math.max(1,Number(it.qty)||1);
      const p=itemProductRef(it);
      const realImg=(galleryOf(p)[0]||it.image||'').trim();
      const initials=escapeHtml((it.name||'RG').slice(0,2).toUpperCase());
      const thumb=realImg?`<img class="receipt-item-thumb" src="${escapeHtml(realImg)}" alt="${escapeHtml(it.name)}" loading="eager" crossorigin="anonymous" referrerpolicy="no-referrer" onerror="this.replaceWith(Object.assign(document.createElement('div'),{className:'receipt-item-thumb receipt-thumb-fallback',textContent:'${initials}'}))">`:`<div class="receipt-item-thumb receipt-thumb-fallback">${initials}</div>`;
      return `<div class="receipt-item-pro has-thumb gift-receipt-row v141-receipt-item"><div class="receipt-item-index">🎁</div>${thumb}<div class="receipt-item-info"><b>${escapeHtml(it.name)}</b><span>${num(qty)} ${qty===1?'unidad':'unidades'} · Regalo incluido</span>${itemColorText(it)?`<small>${escapeHtml(itemColorText(it))}</small>`:''}</div><strong>Lps. 0</strong></div>`;
    }).join('');
    const commissionRow=(isCodDoc(doc)||c.commission>0)?`<div><span>Comisión pagar al recibir</span><b>${money(c.commission)}</b></div>`:'';
    const discountRow=c.discount>0?`<div><span>Descuento</span><b>- ${money(c.discount)}</b></div>`:'';
    const note=isSale?'Gracias por su compra. Conserve este recibo para cualquier consulta.':'Cotización sujeta a disponibilidad. Confirme total, entrega y pago antes de depositar.';
    return `<div class="doc-wrap compact-doc doc-v21 doc-v23 receipt-pro-v4 receipt-v32 receipt-v36 receipt-v49-tight v141-receipt ${isSale?'receipt-sale-v32':'receipt-quote-v32'}" id="printableDoc">
      <div class="receipt-band-pro"><span>${titleText}</span><b>${statusText}</b></div>
      <div class="receipt-inner-pro">
        <header class="receipt-header-pro v141-receipt-header">
          <div class="receipt-brand-pro v141-receipt-brand">
            <div class="receipt-logo-box"><span>SD</span><img class="doc-logo receipt-logo-inline" src="${RECEIPT_LOGO_SRC}" alt="Logo SD Comayagua" loading="eager" decoding="sync" onerror="this.onerror=null;this.src=LOGO_SRC;this.parentElement.classList.add('logo-fallback-active')"></div>
            <div class="v141-receipt-heading">
              <small>Soluciones Digitales Comayagua</small>
              <h2>${headerTitle}</h2>
              <div class="v141-receipt-meta"><span>${dateOnly}</span><span>${timeOnly}</span><span>${escapeHtml(code)}</span></div>
            </div>
          </div>

        </header>

        <section class="receipt-client-pro receipt-client-v32 v141-receipt-client">
          <article class="wide"><span>Cliente</span><b>${escapeHtml(clientName)}</b></article>
          <article><span>Ubicación</span><b>${escapeHtml(location)}</b></article>
          <article><span>Teléfono</span><b>${escapeHtml(phone)}</b></article>
          <article><span>Pago</span><b>${paymentTitle}</b></article>
          <article><span>Entrega</span><b>${escapeHtml(delivery)}</b></article>
          ${doc.reference?`<article class="wide"><span>Referencia</span><b>${escapeHtml(doc.reference)}</b></article>`:''}
        </section>

        <section class="receipt-process-pro v141-receipt-process">
          <div><span>Proceso de pago</span><b>${paymentTitle}</b></div>
          <p>${process}</p>
        </section>

        <section class="receipt-products-pro v141-receipt-products">
          <div class="receipt-title-pro v141-receipt-title"><span>${productTitle}</span><b>${itemCount} ${itemCount===1?'artículo':'artículos'}${giftCount?` · ${giftCount} regalo${giftCount===1?'':'s'}`:''}</b></div>
          ${rows}${giftRows}
        </section>

        <section class="receipt-summary-pro v141-receipt-summary">
          <div><span>Subtotal productos</span><b>${money(c.products)}</b></div>
          <div><span>Envío</span><b>${money(c.shipping)}</b></div>
          ${commissionRow}
          ${discountRow}
          <div class="grand"><span>Total a pagar</span><b>${money(c.total)}</b></div>
        </section>

        <footer class="receipt-footer-pro receipt-footer-clean v141-receipt-footer">
          <div class="receipt-note-text">${note}</div>
          <div class="receipt-whatsapp-pill">WhatsApp: +504 3151-7755</div>
        </footer>
      </div>
    </div>`
  }
  function whatsappText(doc,isSale){
    const c=calc(doc);
    const date=new Date(doc.date||Date.now()).toLocaleString('es-HN',{day:'2-digit',month:'short',year:'numeric',hour:'numeric',minute:'2-digit'});
    const shippingTitle=shippingLabel(doc);
    const client=String(doc.client||'').trim()||'Cliente';
    const phone=String(doc.phone||'').trim()||'No registrado';
    const helloName=(client.split(/\s+/)[0]||'Cliente').trim()||'Cliente';
    const referenceLine=String(doc.reference||'').trim()?`\n📍 Referencia: ${doc.reference}`:'';
    const productLines=(doc.items||[]).length?(doc.items||[]).map((it,i)=>{
      const qty=Math.max(1,Number(it.qty)||1);
      const total=itemTotal(it);
      const unit=qty?total/qty:total;
      const color=itemColorText(it);
      const p=itemProductRef(it);
      const promo=promoTotalForQty(p,qty)!==null;
      return `${i+1}️⃣ *${it.name}*
   🔢 Cantidad: *${num(qty)} ${qty===1?'unidad':'unidades'}*
   💵 Precio c/u: *${money(unit)}*
   🧾 Total: *${money(total)}*${color?`\n   🎨 Color: *${color}*`:''}${promo?`\n   🎁 Oferta aplicada`:''}`;
    }).join('\n\n'):'Sin productos agregados.';
    const modality=isCodDoc(doc)?'Pagar al recibir':isLocalDoc(doc)?'Envío local':'Envío normal';
    const commissionLine=(isCodDoc(doc)||c.commission>0)?`\n   • Comisión: *${money(c.commission)}*`:'';
    const discountLine=c.discount>0?`\n   • Descuento: *- ${money(c.discount)}*`:'';
    const title=isSale?'🧾 *RECIBO / VENTA - SD COMAYAGUA*':'📋 *COTIZACIÓN - SD COMAYAGUA*';
    const intro=isSale
      ? `Hola *${helloName}*, gracias por su compra. Le compartimos el detalle de su pedido:`
      : `Hola *${helloName}*, gracias por consultar. Le compartimos su cotización lista para revisar:`;
    const footer=isSale
      ? '✅ *Pedido registrado.* Guarde este mensaje para cualquier consulta sobre su compra.'
      : '✅ *Para confirmar:* responda por este medio y le validamos disponibilidad, entrega y pago antes de cerrar el pedido.';
    return `${title}
━━━━━━━━━━━━━━━━━━━━

${intro}

👤 *CLIENTE*
• Nombre: *${client}*
• Teléfono: ${phone}
• Ubicación: ${doc.department||'No seleccionado'} / ${doc.municipality||'No seleccionado'}${referenceLine}

🛍️ *PRODUCTOS*
${productLines}

🚚 *ENTREGA / PAGO*
• Modalidad: *${modality}*
• Empresa / entrega: ${doc.company||'No seleccionada'}
• Envío: *${money(c.shipping)}*${commissionLine}
• Nota: ${shippingNote(doc)}

💰 *RESUMEN DE PAGO*
   • Productos: *${money(c.products)}*${discountLine}
   • Envío / comisión: *${money(c.delivery)}*

✅ *TOTAL A PAGAR: ${money(c.total)}*

${footer}

🏪 *SD COMAYAGUA*
📲 WhatsApp: +504 3151-7755`;
  }



  function waPhone(phone){const p=cleanPhone(phone); return p? (p.length===8?'504'+p:p) : ''}
  function waWebUrl(phone,text){const p=waPhone(phone); return p?`https://wa.me/${p}?text=${encodeURIComponent(text)}`:`https://wa.me/?text=${encodeURIComponent(text)}`}
  function waAppUrl(phone,text){const p=waPhone(phone); return `whatsapp://send?${p?`phone=${p}&`:''}text=${encodeURIComponent(text)}`}
  function openWhatsApp(phone,text){
    if(isMobileDevice()){
      window.location.href=waAppUrl(phone,text);
    }else{
      window.open(waWebUrl(phone,text),'_blank');
    }
  }
  function currentDoc(isSale){return isSale?saleDraft:quote}
  function chooseWaPhone(doc){
    const storeLast=cleanPhone(state.settings.whatsappNumber||'').slice(-8);
    const current=cleanPhone(doc.phone||'').slice(-8);
    if(!current || current===storeLast){
      const typed=prompt('Número WhatsApp del cliente. Déjalo vacío para elegir el chat manualmente en WhatsApp:', current===storeLast?'':(doc.phone||''));
      if(typed===null) return null;
      doc.phone=typed.trim();
      refreshQuoteUI(doc.kind==='receipt' || doc===saleDraft);
    }
    return doc.phone||'';
  }
  function sendWhatsAppText(isSale){const doc=currentDoc(isSale); if(!doc.items.length)return toast('Agrega productos primero.'); const c=calc(doc); if(c.products<=0||c.total<=0)return toast('El total está en cero. Revisa producto, precio y envío antes de enviar.'); const phone=chooseWaPhone(doc); if(phone===null)return; save(); openWhatsApp(phone,whatsappText(doc,isSale));}
  function receiptLandscapeHTML(doc,isSale=true){
    const c=calc(doc);
    const date=new Date(doc.date||Date.now()).toLocaleString('es-HN',{day:'2-digit',month:'long',year:'numeric',hour:'numeric',minute:'2-digit'});
    const title=isSale?'RECIBO DE COMPRA':'COTIZACIÓN SD COMAYAGUA';
    const status=isSale?'VENTA CONFIRMADA':'COTIZACIÓN';
    const note=isSale?'Gracias por su compra. Conserve este recibo para cualquier consulta.':'Cotización sujeta a disponibilidad. Confirme total, entrega y pago antes de depositar.';
    const allItems=doc.items||[];
    const maxItems=6;
    const visibleItems=allItems.slice(0,maxItems);
    const moreCount=Math.max(0,allItems.length-visibleItems.length);
    const rows=visibleItems.map((it,i)=>{
      const qty=Math.max(1,+it.qty||1);
      const total=itemTotal(it);
      const unit=total/qty;
      const img=it.image||productImage(itemProductRef(it))||captureFallbackImage();
      return `<div class="rp-row"><span class="rp-num">${i+1}</span><img src="${escapeHtml(img)}" crossorigin="anonymous" onerror="this.onerror=null;this.src='${escapeHtml(captureFallbackImage())}'"><div class="rp-prod"><b>${escapeHtml(it.name)}</b><small>${num(qty)} ${qty===1?'unidad':'unidades'} · ${money(unit)} c/u${itemColorLine(it)}</small></div><strong>${money(total)}</strong></div>`;
    }).join('')||'<div class="rp-empty">Sin productos agregados.</div>';
    const moreRow=moreCount?`<div class="rp-more">+ ${num(moreCount)} producto${moreCount===1?'':'s'} adicional${moreCount===1?'':'es'} incluido${moreCount===1?'':'s'} en el total.</div>`:'';
    const commission=c.commission?`<div><span>Comisión pagar al recibir</span><b>${money(c.commission)}</b></div>`:'';
    const discount=c.discount?`<div><span>Descuento</span><b>- ${money(c.discount)}</b></div>`:'';
    return `<article class="receiptPage-v50" id="receiptLandscapeDoc">
      <header class="rp-top"><span>RECIBO SD COMAYAGUA</span><b>${status}</b></header>
      <section class="rp-hero">
        <div class="rp-brand"><img src="${RECEIPT_LOGO_SRC}" crossorigin="anonymous" onerror="this.style.display='none'"><div><small>SD COMAYAGUA</small><h1>${title}</h1><p>${date}</p><p>${escapeHtml(doc.id||'SDC')}</p></div></div>
        <div class="rp-total"><span>Total a pagar</span><b>${money(c.total)}</b></div>
      </section>
      <section class="rp-info">
        <div><span>Cliente</span><b>${escapeHtml(doc.client||'Cliente no registrado')}</b></div>
        <div><span>Teléfono</span><b>${escapeHtml(doc.phone||'No registrado')}</b></div>
        <div><span>Ubicación</span><b>${escapeHtml((doc.department||'Comayagua')+' / '+(doc.municipality||'Comayagua'))}</b></div>
        <div><span>Pago / entrega</span><b>${escapeHtml(shippingLabel(doc))}</b></div>
      </section>
      <section class="rp-payment"><div><span>Proceso de pago</span><b>${escapeHtml(shippingLabel(doc))}</b></div><p>${escapeHtml(shippingNote(doc))}</p></section>
      <section class="rp-products"><div class="rp-section-head"><span>${isSale?'Productos vendidos':'Productos cotizados'}</span><b>${(doc.items||[]).reduce((a,x)=>a+(+x.qty||1),0)} ${(doc.items||[]).length===1?'artículo':'artículos'}</b></div><div class="rp-lines">${rows}${moreRow}</div></section>
      <section class="rp-summary"><div><span>Subtotal productos</span><b>${money(c.products)}</b></div><div><span>Envío</span><b>${money(c.shipping)}</b></div>${commission}${discount}<div class="grand"><span>Total a pagar</span><b>${money(c.total)}</b></div></section>
      <footer class="rp-footer"><p>${note}</p><b>WhatsApp: +504 3151-7755</b></footer>
    </article>`;
  }
  function receiptLandscapeCSS(){return `
    .receiptPage-v50{width:1600px;height:1040px;background:#f3f4ee;color:#07131a;font-family:Barlow,Arial,sans-serif;border-radius:0;overflow:hidden;padding:0 42px 40px;border:0;box-shadow:none;position:relative}
    .receiptPage-v50 *{box-sizing:border-box}.rp-top{height:82px;margin:0 -42px 28px;background:linear-gradient(135deg,#07131a,#0b2748);color:white;display:flex;align-items:center;justify-content:space-between;padding:0 42px;border-bottom:7px solid #1d7dff}.rp-top span{font-size:26px;text-transform:uppercase;letter-spacing:.18em;font-weight:950}.rp-top>b{background:#dbeafe;color:#062047;border-radius:999px;padding:16px 30px;text-transform:uppercase;letter-spacing:.11em;font-size:22px;box-shadow:0 10px 30px rgba(0,0,0,.12)}.rp-hero{display:grid;grid-template-columns:1fr 430px;gap:28px;margin-bottom:20px}.rp-brand,.rp-total,.rp-info>div,.rp-payment,.rp-products,.rp-summary,.rp-footer{background:white;border:1px solid #d7e5f6;border-radius:28px}.rp-brand{display:flex;align-items:center;gap:26px;padding:26px 30px}.rp-brand img{width:116px;height:116px;object-fit:contain;background:white;border:1px solid #d7e5f6;border-radius:24px;padding:7px;box-shadow:0 14px 34px rgba(20,26,22,.10)}.rp-brand small,.rp-total span,.rp-info span,.rp-payment span,.rp-summary span,.rp-section-head span{display:block;text-transform:uppercase;letter-spacing:.16em;color:#64748b;font-size:18px;font-weight:950}.rp-brand small{font-size:21px;color:#5c728d}.rp-brand h1{margin:2px 0 7px;font-size:66px;line-height:.86;letter-spacing:-.055em;color:#07131a}.rp-brand p{margin:2px 0;color:#384f68;font-size:24px;font-weight:900;line-height:1.06}.rp-total{background:linear-gradient(135deg,#eef6ff,#f7fbff);border-color:#cfe1f8;padding:34px 32px;display:flex;flex-direction:column;justify-content:center}.rp-total b{display:block;font-size:86px;line-height:.92;letter-spacing:-.075em;color:#07131a;margin-top:16px;white-space:nowrap}.rp-info{display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:16px;margin-bottom:18px}.rp-info>div{padding:18px 20px;min-height:94px}.rp-info b{display:block;color:#07131a;font-size:22px;line-height:1.08;margin-top:9px}.rp-payment{display:grid;grid-template-columns:310px 1fr;gap:18px;align-items:center;background:#eef6ff;border-color:#cfe1f8;padding:22px 24px;margin-bottom:18px}.rp-payment b{display:block;color:#07131a;font-size:28px;margin-top:8px}.rp-payment p{margin:0;color:#243c56;font-size:23px;line-height:1.25;font-weight:850}.rp-products{overflow:hidden;margin-bottom:18px}.rp-section-head{height:70px;background:linear-gradient(135deg,#07131a,#0b2748);color:white;display:flex;align-items:center;justify-content:space-between;padding:0 28px}.rp-section-head span{color:white}.rp-section-head b{color:#dbeafe;font-size:22px;text-transform:uppercase;letter-spacing:.08em}.rp-lines{background:#fff}.rp-row{display:grid;grid-template-columns:58px 76px 1fr 150px;align-items:center;gap:16px;min-height:86px;padding:10px 26px;border-top:1px solid #e1ebf7}.rp-row:first-child{border-top:0}.rp-row img{width:76px;height:76px;object-fit:cover;border-radius:16px;background:#edf5ff}.rp-num{width:50px;height:50px;border-radius:16px;background:#edf5ff;display:grid;place-items:center;font-weight:950;color:#0b63ce;font-size:20px}.rp-prod{min-width:0}.rp-row b{display:block;color:#07131a;font-size:22px;line-height:1.05;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.rp-row small{display:block;color:#5e7068;font-size:16px;font-weight:850;margin-top:5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.rp-row strong{text-align:right;color:#07131a;font-size:25px;white-space:nowrap}.rp-more{padding:12px 26px;background:#f7fbff;color:#3e5872;font-weight:900;font-size:18px;border-top:1px solid #e1ebf7}.rp-empty{padding:24px;color:#536b86;font-weight:900}.rp-summary{overflow:hidden;margin-bottom:18px}.rp-summary>div{display:flex;align-items:center;justify-content:space-between;min-height:62px;padding:0 28px;border-top:1px solid #e1ebf7}.rp-summary>div:first-child{border-top:0}.rp-summary b{font-size:28px;color:#07131a;white-space:nowrap}.rp-summary .grand{min-height:88px;background:linear-gradient(135deg,#07131a,#0b2748);color:#fff}.rp-summary .grand span{color:white}.rp-summary .grand b{font-size:60px;color:#dbeafe;letter-spacing:-.06em}.rp-footer{display:grid;grid-template-columns:1fr auto;gap:22px;align-items:center;padding:24px 30px;min-height:110px}.rp-footer p{margin:0;color:#243c56;font-size:23px;line-height:1.22;font-weight:850}.rp-footer b{border:1px solid #cfe1f8;background:#eef6ff;color:#0b63ce;border-radius:999px;padding:14px 24px;font-size:21px;white-space:nowrap}
    @media print{@page{size:letter portrait;margin:0}html,body{margin:0!important;background:white!important;width:100%!important;height:100%!important;overflow:hidden!important}.receiptPage-v50{width:100vw!important;height:100vh!important;border-radius:0!important;padding:0 26px 22px!important}.rp-top{margin:0 -26px 16px!important;height:58px!important;border-bottom-width:4px!important}.rp-top span{font-size:16px!important}.rp-top>b{font-size:14px!important;padding:8px 16px!important}.rp-hero{grid-template-columns:1fr 250px!important;gap:12px!important;margin-bottom:10px!important}.rp-brand{padding:12px 14px!important;gap:12px!important;border-radius:16px!important}.rp-brand img{width:60px!important;height:60px!important}.rp-brand small{font-size:11px!important}.rp-brand h1{font-size:31px!important}.rp-brand p{font-size:11px!important}.rp-total{padding:12px 16px!important;border-radius:16px!important}.rp-total span,.rp-info span,.rp-payment span,.rp-summary span,.rp-section-head span{font-size:10px!important}.rp-total b{font-size:44px!important;margin-top:8px!important}.rp-info{gap:8px!important;margin-bottom:8px!important}.rp-info>div{padding:8px 10px!important;min-height:48px!important;border-radius:12px!important}.rp-info b{font-size:12px!important;margin-top:4px!important}.rp-payment{grid-template-columns:170px 1fr!important;gap:8px!important;padding:9px 12px!important;margin-bottom:8px!important;border-radius:13px!important}.rp-payment b{font-size:14px!important}.rp-payment p{font-size:12px!important}.rp-products{margin-bottom:8px!important;border-radius:14px!important}.rp-section-head{height:42px!important;padding:0 14px!important}.rp-section-head b{font-size:13px!important}.rp-row{grid-template-columns:32px 42px 1fr 78px!important;gap:8px!important;min-height:50px!important;padding:6px 12px!important}.rp-row img{width:40px!important;height:40px!important;border-radius:9px!important}.rp-num{width:30px!important;height:30px!important;border-radius:9px!important;font-size:12px!important}.rp-row b{font-size:12px!important}.rp-row small{font-size:9px!important}.rp-row strong{font-size:13px!important}.rp-summary{margin-bottom:8px!important;border-radius:13px!important}.rp-summary>div{min-height:36px!important;padding:0 14px!important}.rp-summary b{font-size:15px!important}.rp-summary .grand{min-height:47px!important}.rp-summary .grand b{font-size:31px!important}.rp-footer{min-height:48px!important;padding:8px 14px!important;border-radius:13px!important}.rp-footer p{font-size:11px!important}.rp-footer b{font-size:11px!important;padding:7px 10px!important}}
  `}
  async function landscapeDocToBlob(doc,isSale=true){
    const host=document.createElement('div');
    host.className='productPhotoExportHost docReceiptExportHost';
    host.innerHTML=`<style>${receiptLandscapeCSS()}</style>${receiptLandscapeHTML(doc,isSale)}`;
    document.body.appendChild(host);
    try{
      await waitImages(host);
      const el=host.querySelector('#receiptLandscapeDoc');
      return await captureNodeAsPngBlob(el,2.35);
    }finally{host.remove();}
  }

  async function docToBlob(isSale=false){
    const doc=currentDoc(isSale);
    if(!doc.items.length){toast('Agrega productos primero.'); return null;}
    const holder=$('#docPreview',modalRoot);
    if(holder){
      clearTimeout(window.__sdcDocPreviewTimer);
      holder.dataset.previewRequested='1';
      holder.innerHTML=docCard(doc,isSale);
      holder.dataset.sig=getQuoteSig(doc);
    }
    const el=$('#printableDoc',modalRoot);
    const blob=await captureNodeToBlob(el,'#eaf5f9');
    if(!blob) toast('No se pudo generar la imagen vertical del documento. Verifique que las miniaturas hayan cargado o use el botón PDF.');
    return blob;
  }

  function blobToDataURL(blob){
    return new Promise((resolve,reject)=>{
      const reader=new FileReader();
      reader.onload=()=>resolve(reader.result);
      reader.onerror=reject;
      reader.readAsDataURL(blob);
    });
  }
  async function printDocumentCard(isSale=false){
    const doc=currentDoc(isSale);
    if(!doc.items.length)return toast('Agrega productos primero.');
    const c=calc(doc);
    if(c.products<=0||c.total<=0)return toast('El total está en cero. Revisa producto, precio y envío antes de imprimir.');
    const popup=window.open('','_blank');
    if(!popup){
      await downloadDocImage(isSale?'recibo':'cotizacion');
      toast('El navegador bloqueó la ventana de PDF. Se descargó la imagen limpia para imprimirla o enviarla.');
      return;
    }
    popup.document.open();
    popup.document.write(`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Preparando documento SD Comayagua</title><style>html,body{margin:0;height:100%;background:#f4fbff;font-family:Arial,sans-serif;color:#061522;display:grid;place-items:center}.box{padding:24px;border:1px solid #d9ecf5;border-radius:18px;background:white;text-align:center;font-weight:800}</style></head><body><div class="box">Preparando PDF limpio de SD COMAYAGUA...</div></body></html>`);
    popup.document.close();
    try{
      const blob=await docToBlob(isSale);
      if(!blob)throw new Error('No se pudo crear la imagen del documento.');
      const dataURL=await blobToDataURL(blob);
      const title=isSale?'Recibo SD Comayagua':'Cotización SD Comayagua';
      const html=`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title><style>
        @page{size:letter portrait;margin:0}*{box-sizing:border-box}html,body{margin:0!important;padding:0!important;width:100%!important;height:99vh!important;background:#fff;color:#061522;overflow:hidden!important}body{display:block!important}.paper{position:fixed!important;inset:0!important;width:100vw!important;height:98.8vh!important;margin:0!important;padding:0!important;background:#fff!important;display:flex!important;align-items:center!important;justify-content:center!important;overflow:hidden!important;break-inside:avoid!important;page-break-inside:avoid!important;page-break-after:avoid!important}.paper img{display:block!important;width:auto!important;height:auto!important;max-width:99vw!important;max-height:98vh!important;object-fit:contain!important;background:#fff!important;break-inside:avoid!important;page-break-before:avoid!important;page-break-after:avoid!important;page-break-inside:avoid!important}.hint{display:none}@media screen{html,body{overflow:auto!important;background:#edf4fb!important}.paper{position:relative!important;inset:auto!important;min-height:99vh!important;box-shadow:0 18px 50px rgba(0,0,0,.18)}}@media print{html,body{overflow:hidden!important;height:99vh!important}.paper{height:98vh!important;break-inside:avoid!important;page-break-inside:avoid!important;page-break-after:avoid!important}.paper img{max-height:97.8vh!important;break-inside:avoid!important;page-break-inside:avoid!important;page-break-after:avoid!important}}
      </style></head><body><main class="paper"><img alt="${title}" src="${dataURL}"></main><script>window.onload=()=>setTimeout(()=>{window.focus();window.print();},250);<\/script></body></html>`;
      popup.document.open();
      popup.document.write(html);
      popup.document.close();
    }catch(err){
      console.error(err);
      try{popup.close();}catch(e){}
      await downloadDocImage(isSale?'recibo':'cotizacion');
      toast('No se pudo abrir el PDF limpio. Se descargó la imagen del recibo.');
    }
  }

  async function downloadDocImage(name='documento'){
    const isSale=name==='recibo';
    const doc=isSale?saleDraft:quote;
    const blob=await docToBlob(isSale);
    if(!blob)return;
    const a=document.createElement('a');
    a.href=URL.createObjectURL(blob);
    a.download=`${name}${isSale?'-cliente':''}-${clientLabel(doc)}-${fileStamp()}-${slugFile(doc?.id||'sdc')}.png`;
    a.click();
    setTimeout(()=>URL.revokeObjectURL(a.href),1000);
    toast(isSale?'Recibo limpio descargado con nombre único.':'Imagen descargada con nombre único.');
  }
  async function copyTextSafe(text){
    try{await navigator.clipboard?.writeText(text); return true;}catch(e){return false;}
  }
  async function copyImageSafe(blob){
    try{
      if(navigator.clipboard && window.ClipboardItem && blob){
        await navigator.clipboard.write([new ClipboardItem({'image/png':blob})]);
        return true;
      }
    }catch(e){}
    return false;
  }
  function sleep(ms){return new Promise(res=>setTimeout(res,ms));}
  async function waitForImages(root,timeout=12000){
    const el=root||document;
    const imgs=Array.from(el.querySelectorAll('img'));
    if(!imgs.length)return;
    await Promise.all(imgs.map(img=>new Promise(resolve=>{
      if(img.complete && img.naturalWidth>0)return resolve();
      const done=()=>{clearTimeout(timer); img.removeEventListener('load',done); img.removeEventListener('error',done); resolve();};
      const timer=setTimeout(done,timeout);
      img.addEventListener('load',done,{once:true});
      img.addEventListener('error',done,{once:true});
      try{img.setAttribute('crossorigin','anonymous');}catch(e){}
    })));
    await sleep(80);
  }
  async function captureNodeToBlob(el,backgroundColor){
    if(!el)return null;
    if(!await ensureHtml2Canvas()){
      toast('La librería para descargar imágenes todavía no cargó. Revisa tu conexión y vuelve a tocar Descargar imagen.');
      return null;
    }
    await waitForImages(el);
    try{
      const exportScale=isMobileDevice()?1.45:2.1;
      const canvas=await html2canvas(el,{backgroundColor,scale:exportScale,useCORS:true,allowTaint:false,imageTimeout:15000,removeContainer:true,scrollX:0,scrollY:0,windowWidth:document.documentElement.clientWidth,onclone:(doc)=>{
        doc.body.classList.add('capture-exporting','capture-v7-stable');
        doc.querySelectorAll('img').forEach(img=>{
          try{
            img.setAttribute('crossorigin','anonymous');
            img.setAttribute('referrerpolicy','no-referrer');
            img.loading='eager';
            img.decoding='sync';
            img.style.background='transparent';
            const isBrandLogo=img.classList.contains('share-brand-logo') || img.classList.contains('receipt-logo-inline') || img.classList.contains('doc-logo');
            const src=(img.getAttribute('src')||'').trim();
            if(isBrandLogo){ img.setAttribute('src', RECEIPT_LOGO_SRC); }
            else if(!src || src==='undefined' || src==='null'){
              img.setAttribute('src', captureFallbackImage());
            }
          }catch(e){}
        });
      }});
      return await new Promise(res=>canvas.toBlob(res,'image/png',.98));
    }catch(err){
      console.error(err);
      return null;
    }
  }

  async function shareDocPhoto(isSale){
    const doc=currentDoc(isSale);
    if(!doc.items.length)return toast('Agrega productos primero.');
    const c=calc(doc);
    if(c.products<=0||c.total<=0)return toast('El total está en cero. Revisa producto, precio y envío antes de enviar.');
    save();
    const blob=await docToBlob(isSale);
    const text=whatsappText(doc,isSale);
    const filename=`${isSale?'recibo-cliente':'cotizacion'}-${clientLabel(doc)}-${fileStamp()}-${slugFile(doc.id||'sdc')}.png`;
    if(blob && navigator.canShare){
      const file=new File([blob],filename,{type:'image/png'});
      if(navigator.canShare({files:[file]})){
        try{
          await navigator.share({files:[file],text,title:isSale?'Recibo SD Comayagua':'Cotización SD Comayagua'});
          toast('Selecciona WhatsApp. Se compartió la imagen con el mensaje.');
          return;
        }catch(e){
          if(e && e.name==='AbortError')return;
        }
      }
    }
    const copiedImage=blob?await copyImageSafe(blob):false;
    await copyTextSafe(text);
    if(!copiedImage && blob){
      const a=document.createElement('a');
      a.href=URL.createObjectURL(blob);
      a.download=filename;
      a.click();
      setTimeout(()=>URL.revokeObjectURL(a.href),1000);
    }
    const phone=chooseWaPhone(doc);
    if(phone!==null) openWhatsApp(phone,text);
    toast(copiedImage?'WhatsApp se abrió con el texto. La imagen quedó copiada; pégala en el chat si no aparece automáticamente.':'Se descargó la imagen y se abrió WhatsApp con el texto. Adjunta la imagen descargada si el navegador no la envía solo.');
  }

  function finishSale(){
    if(!saleDraft.items.length)return toast('Agrega productos primero.');
    saleDraft.gifts=Array.isArray(saleDraft.gifts)?saleDraft.gifts:[];
    const editingId=saleDraft.editingId||'';
    const previous=editingId?state.sales.find(x=>x.id===editingId):null;
    const prevQty=new Map();
    function addVariantQty(map,it){
      if(!it||!it.id)return;
      const p=productById(it.id)||it;
      if(hasColorStock(p) && !selectedColorLabel(it)) it.color=defaultColorForProduct(p);
      const color=hasColorStock(p)?selectedColorLabel(it):'';
      const key=`${it.id}::${colorKey(color)}`;
      const row=map.get(key)||{id:it.id,name:it.name||p.name||'Producto',color,qty:0};
      row.qty+=Math.max(1,+it.qty||1);
      if(!row.color) row.color=color;
      map.set(key,row);
    }
    (previous?.items||[]).forEach(it=>addVariantQty(prevQty,it));
    (previous?.gifts||[]).forEach(it=>addVariantQty(prevQty,it));
    const checkQty=new Map();
    (saleDraft.items||[]).forEach(it=>addVariantQty(checkQty,it));
    (saleDraft.gifts||[]).forEach(it=>addVariantQty(checkQty,it));
    for(const [key,row] of checkQty.entries()){
      const p=productById(row.id);
      const before=prevQty.get(key)?.qty||0;
      const diff=row.qty-before;
      if(p && hasColorStock(p) && !row.color){toast(`Elegí color para ${p.name}.`); return;}
      const available=p?(hasColorStock(p)?colorQtyAvailable(p,row.color):productStock(p)):0;
      if(p && diff>available){toast(`Stock insuficiente para ${p.name}${row.color?` color ${row.color}`:''}. Disponible: ${num(available)}.`); return;}
      const sold=(saleDraft.items||[]).some(it=>itemVariantKey(it)===key);
      if(sold && p && Number(p.price||0)-Number(p.cost||0)<0){toast(`Revisá ${p.name}: el costo es mayor que el precio.`); return;}
    }
    const c=calc(saleDraft);
    saleDraft.date=new Date().toISOString();
    saleDraft.total=c.total;
    const newQty=new Map();
    (saleDraft.items||[]).forEach(it=>addVariantQty(newQty,it));
    (saleDraft.gifts||[]).forEach(it=>addVariantQty(newQty,it));
    const variantKeys=new Set([...prevQty.keys(),...newQty.keys()]);
    variantKeys.forEach(key=>{
      const row=newQty.get(key)||prevQty.get(key);
      const p=productById(row?.id); if(!p)return;
      const before=prevQty.get(key)?.qty||0;
      const after=newQty.get(key)?.qty||0;
      adjustProductColorStock(p,row.color,after-before);
    });
    const ids=new Set(Array.from(variantKeys).map(key=>(newQty.get(key)||prevQty.get(key))?.id).filter(Boolean));
    saleDraft.date=new Date().toISOString(); saleDraft.kind='receipt'; saleDraft.total=c.total; const clean=SDCStore.clone(saleDraft); delete clean.editingId;
    if(previous){
      const ix=state.sales.findIndex(x=>x.id===editingId);
      if(ix>=0) state.sales[ix]=clean;
    }else{
      state.sales.unshift(clean);
    }
    state.lastReceipt=SDCStore.clone(clean);
    saveClientFromDoc(clean);
    SDCStore.saveBackup(state,previous?'Factura editada':'Venta registrada');
    saveDocumentToFirebase(clean,'sale').catch(err=>console.warn('No se guardó la venta en Firebase',err));
    syncStockAfterSale(ids).then(ok=>{ if(ok) console.info('Stock sincronizado con Firebase.'); }).catch(err=>console.warn('No se sincronizó el stock en Firebase',err));
    save(); if($('#cartList',modalRoot)) refreshQuoteUI(true); render(); toast(previous?'Factura actualizada sin duplicarla. Stock actualizado por color.':'Venta finalizada, recibo guardado y stock actualizado por color.');
  }

  function normalizeImportHeader(h){
    return String(h||'').replace(/^\uFEFF/,'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'');
  }
  function importCleanValue(v){
    if(v===undefined||v===null) return '';
    return String(v).replace(/^\uFEFF/,'').trim();
  }
  function parseImportNumber(v){
    let s=importCleanValue(v).replace(/lps\.?|hnl|lempiras?/ig,'').replace(/\s+/g,'');
    if(!s) return 0;
    s=s.replace(/[^0-9,.-]/g,'');
    if(s.includes(',') && s.includes('.')) s=s.replace(/,/g,'');
    else if(s.includes(',') && !s.includes('.')){
      const parts=s.split(',');
      s=(parts.length===2 && parts[1].length===3)?parts.join(''):s.replace(',', '.');
    }
    const n=Number(s);
    return Number.isFinite(n)?n:0;
  }
  function csvEscape(v){
    const s=String(v??'');
    return /[",\n\r]/.test(s)?`"${s.replace(/"/g,'""')}"`:s;
  }
  function detectDelimiter(text){
    const sample=String(text||'').split(/\r?\n/).find(x=>x.trim())||'';
    const count=(ch)=>{let c=0,q=false; for(let i=0;i<sample.length;i++){const a=sample[i]; if(a==='"'){ if(q&&sample[i+1]==='"')i++; else q=!q;} else if(!q && a===ch)c++; } return c;};
    const opts=[',',';','\t'].map(ch=>({ch,n:count(ch)})).sort((a,b)=>b.n-a.n);
    return opts[0].n?opts[0].ch:',';
  }
  function parseCSVText(text){
    text=String(text||'').replace(/^\uFEFF/,'');
    const delim=detectDelimiter(text);
    const rows=[]; let row=[], cell='', q=false;
    for(let i=0;i<text.length;i++){
      const ch=text[i];
      if(ch==='"'){
        if(q && text[i+1]==='"'){cell+='"'; i++;}
        else q=!q;
      } else if(ch===delim && !q){row.push(cell); cell='';}
      else if((ch==='\n'||ch==='\r') && !q){
        if(ch==='\r' && text[i+1]==='\n') i++;
        row.push(cell); cell='';
        if(row.some(x=>String(x).trim()!=='')) rows.push(row);
        row=[];
      } else cell+=ch;
    }
    row.push(cell);
    if(row.some(x=>String(x).trim()!=='')) rows.push(row);
    if(!rows.length) return [];
    const headers=rows.shift().map(h=>importCleanValue(h));
    return rows.map(r=>{const o={}; headers.forEach((h,i)=>o[h]=r[i]??''); return o;});
  }
  function splitImportImages(v){
    const raw=importCleanValue(v);
    if(!raw) return [];
    return raw.split(/\s*(?:\r?\n|\||;)\s*/).map(x=>x.trim()).filter(Boolean);
  }
  function normalizeImportPromos(v){
    const raw=importCleanValue(v);
    if(!raw) return '';
    return raw.split(/\s*(?:\r?\n|\||;|,)\s*/).map(part=>{
      const m=part.match(/(\d+)\s*(?:=|:|x|X|-|a|por|par|pares|unidad|unidades)?\s*[^0-9]*([0-9]+(?:[.,][0-9]+)?)/i);
      if(!m) return '';
      return `${Number(m[1])}=${parseImportNumber(m[2])}`;
    }).filter(Boolean).join('\n');
  }
  function importRowToProduct(row,i){
    const n={}; Object.keys(row||{}).forEach(k=>n[normalizeImportHeader(k)]=row[k]);
    const val=(keys)=>{for(const k of keys){const nk=normalizeImportHeader(k); if(n[nk]!==undefined && importCleanValue(n[nk])!=='') return importCleanValue(n[nk]);} return '';};
    const images=splitImportImages(val(['imagenes','imagen','foto','fotos','image','images','galeria','gallery','urlimagen','linkimagen']));
    const p={
      id:val(['codigo','cod','id','sku','code']) || `SDC-${String(i+1).padStart(3,'0')}`,
      name:val(['nombre','producto','name','title','articulo','item']) || 'Producto sin nombre',
      categories:val(['categoria','categorias','category','categories','etiquetas','tags']) || '',
      price:parseImportNumber(val(['precio','precioventa','precioactual','venta','price'])),
      cost:parseImportNumber(val(['costo','cost','costocompra','preciocompra','compra'])),
      stock:parseImportNumber(val(['stock','existencia','cantidad','inventario','disponible'])),
      colors:val(['colores','colors','colorstock','stockcolores','variantescolor','variantes_color','coloresycantidades']),
      image:images[0]||'',
      gallery:images.slice(1).join('\n'),
      promos:normalizeImportPromos(val(['promos','promociones','precioscantidad','preciosporcantidad','mayoreo','ofertas','promo'])),
      description:val(['descripcion','description','beneficios','detalle','incluye','info'])
    };
    return SDCStore.normalizeProduct(p,i);
  }
  async function readRowsFromProductFile(file){
    const name=(file.name||'').toLowerCase();
    if(name.endsWith('.csv') || file.type.includes('csv') || file.type.startsWith('text/')){
      const txt=await file.text();
      return parseCSVText(txt);
    }
    if(name.endsWith('.xlsx') || name.endsWith('.xls')){
      if(!await ensureXLSX()) throw new Error('La librería XLSX no cargó. Revisa internet o usa CSV.');
      const buf=await file.arrayBuffer();
      const wb=XLSX.read(buf,{type:'array'});
      const first=wb.SheetNames[0];
      if(!first) return [];
      return XLSX.utils.sheet_to_json(wb.Sheets[first],{defval:'',raw:false});
    }
    throw new Error('Formato no soportado. Usa .csv o .xlsx');
  }
  function importProducts(products,mode){
    if(!products.length) throw new Error('No encontré productos válidos.');
    SDCStore.saveBackup(state,'Antes de importar productos');
    if(mode==='replace'){
      state.products=products;
    }else{
      const byId=new Map(state.products.map((p,i)=>[String(p.id).trim().toLowerCase(),i]));
      products.forEach(p=>{
        const key=String(p.id||'').trim().toLowerCase();
        if(key && byId.has(key)) state.products[byId.get(key)]={...state.products[byId.get(key)],...p};
        else state.products.push(p);
      });
    }
    state.products=state.products.map(SDCStore.normalizeProduct);
    save(); SDCStore.saveBackup(state,`Importados ${products.length} productos`);
  }
  async function handleProductImportFile(file){
    try{
      $('#importProductsStatus',modalRoot).innerHTML='Leyendo archivo...';
      const rows=await readRowsFromProductFile(file);
      const products=rows.map(importRowToProduct).filter(p=>p.name && p.name!=='Producto sin nombre');
      if(!products.length) throw new Error('El archivo no tiene filas de productos.');
      const mode=$('#importProductsMode',modalRoot)?.value||'merge';
      const msg=`Encontré ${products.length} productos en ${file.name}.\n\n${mode==='replace'?'REEMPLAZARÁ todo el catálogo actual.':'Actualizará por código y agregará los nuevos.'}\n\n¿Importar ahora?`;
      if(!confirm(msg)){ $('#importProductsStatus',modalRoot).innerHTML='Importación cancelada.'; return; }
      importProducts(products,mode);
      closeModal(); render(); toast(`${products.length} productos importados correctamente.`);
    }catch(err){
      console.error(err);
      $('#importProductsStatus',modalRoot).innerHTML=`No se pudo importar: ${escapeHtml(err.message||err)}`;
      toast('No se pudo importar el archivo.');
    }
  }
  function exportProductsCSV(){
    const headers=['codigo','nombre','categoria','precio','costo','stock','colores','imagenes','promos','descripcion'];
    const rows=state.products.map(p=>{
      const imgs=[p.image,...String(p.gallery||'').split(/\n+/).filter(Boolean)].join(' | ');
      return [p.id,p.name,p.categories,p.price,p.cost,productStock(p),colorRowsText(productColorRows(p)),imgs,String(p.promos||'').replace(/\n+/g,' | '),p.description].map(csvEscape).join(',');
    });
    const blob=new Blob([[headers.join(','),...rows].join('\n')],{type:'text/csv;charset=utf-8'});
    const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='productos-sd-comayagua.csv'; a.click(); setTimeout(()=>URL.revokeObjectURL(a.href),1000);
  }
  function downloadProductTemplateCSV(){
    const csv='codigo,nombre,categoria,precio,costo,stock,colores,imagenes,promos,descripcion\nSDC-001,Adaptador Micro SD,Tecnología,350,110,20,"Gris:7 | Amarillo:3 | Anaranjado:10",https://link-imagen.jpg,"1:350 | 2:690",Descripción del producto';
    const blob=new Blob([csv],{type:'text/csv;charset=utf-8'});
    const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='plantilla-productos-sdc.csv'; a.click(); setTimeout(()=>URL.revokeObjectURL(a.href),1000);
  }

  function openBackup(){
    openModal(`<div class="modal-head"><h3>Respaldo único</h3><button class="close">×</button></div><div class="modal-body backup-v22"><div class="card-box backup-main"><h4>RESPALDO COMPLETO</h4><p>Una sola opción clara: guarda productos, ventas, cotizaciones, clientes, cierre de caja y configuración.</p><div class="modal-actions import-actions" style="position:static"><button class="btn full" id="exportBackup">Descargar respaldo completo</button><label class="btn secondary full">Restaurar respaldo<input id="importBackup" type="file" accept="application/json" hidden></label><button class="btn ghost full" id="manualBackup">Crear copia local automática</button><button class="btn secondary full" data-action="exportAll">Exportar ventas/clientes CSV</button></div></div><details class="card-box"><summary>Herramientas de productos CSV / Excel</summary><p style="color:#b8c8d8">Esto no es respaldo; solo sirve para importar o exportar catálogo de productos.</p><label><span class="label">Modo de importación</span><select class="select" id="importProductsMode"><option value="merge">Actualizar por código y agregar nuevos</option><option value="replace">Reemplazar todo el catálogo</option></select></label><div class="modal-actions import-actions" style="position:static"><label class="btn secondary full">Importar .CSV o .XLSX<input id="importProductsFile" type="file" accept=".csv,.xlsx,.xls,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" hidden></label><button class="btn ghost" id="exportProductsCsv">Exportar productos CSV</button><button class="btn ghost" id="downloadTemplateCsv">Plantilla CSV</button></div><div id="importProductsStatus" class="import-status">Usa columnas: código, nombre, categoría, precio, costo, stock, colores, imágenes, promos y descripción.</div></details><div class="card-box"><h4>Copias locales</h4><div id="backupList"></div></div></div>`,true);
    function draw(){const b=SDCStore.listBackups(); $('#backupList').innerHTML=b.map(x=>`<div class="cart-row"><div><b>${escapeHtml(x.label)}</b><br><span>${new Date(x.date).toLocaleString('es-HN')}</span></div><button class="btn small secondary" data-restore="${x.id}">Restaurar</button></div>`).join('')||'<div class="empty-state">Sin copias locales.</div>'; $$('[data-restore]',modalRoot).forEach(btn=>btn.onclick=()=>{state=SDCStore.restoreBackup(btn.dataset.restore)||state; hydrateState(); closeModal(); render(); toast('Respaldo restaurado.')}); }
    draw();
    $('#exportProductsCsv').onclick=exportProductsCSV;
    $('#downloadTemplateCsv').onclick=downloadProductTemplateCSV;
    $('#importProductsFile').onchange=e=>{const f=e.target.files[0]; if(f) handleProductImportFile(f); e.target.value='';};
    $('#exportBackup').onclick=()=>{hydrateState(); const blob=new Blob([SDCStore.exportData(state)],{type:'application/json'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=`respaldo-sd-comayagua-${fileStamp()}.json`; a.click(); setTimeout(()=>URL.revokeObjectURL(a.href),1000);};
    $('#manualBackup').onclick=()=>{SDCStore.saveBackup(state,'Respaldo completo');draw();toast('Copia local guardada.')};
    $$('[data-action="exportAll"]',modalRoot).forEach(b=>b.onclick=exportAllCSV);
    $('#importBackup').onchange=e=>{const f=e.target.files[0]; if(!f)return; const r=new FileReader(); r.onload=()=>{try{state=SDCStore.importData(r.result);hydrateState();closeModal();render();toast('Respaldo importado.')}catch(err){toast('No se pudo importar.')}}; r.readAsText(f)};
  }

  function quoteSummaryText(q){
    const date=new Date(q.date||Date.now()).toLocaleString('es-HN',{day:'2-digit',month:'short',hour:'numeric',minute:'2-digit'});
    const products=(q.items||[]).map(x=>`${x.name}${selectedColorLabel(x)?` (${selectedColorLabel(x)})`:''}`).slice(0,2).join(', ')||'Sin productos';
    const more=(q.items||[]).length>2?` +${(q.items||[]).length-2}`:'';
    return `${date} · ${products}${more}`;
  }
  function statusOptions(selected='Cotizado'){
    return ['Cotizado','Esperando respuesta','Cliente interesado','Pendiente de pago','Vendido','Cancelado'].map(x=>`<option ${selected===x?'selected':''}>${x}</option>`).join('');
  }
  function reminderText(q){
    const c=calc(q);
    const products=(q.items||[]).map((i,idx)=>`${idx+1}. ${i.name}${selectedColorLabel(i)?` (${selectedColorLabel(i)})`:''} x${num(Math.max(1,+i.qty||1))}`).join('\n')||'Productos consultados';
    return `Hola ${q.client||'Cliente'}, buen día. 😊

Le saluda *SD COMAYAGUA*. Solo queremos confirmar si desea continuar con su cotización:

📋 *Cotización:* ${q.id||'SDC'}
🛍️ *Productos:*
${products}

💰 *Total cotizado:* *${money(c.total)}*

Si desea continuar, con gusto le confirmamos disponibilidad, entrega y forma de pago por este mismo medio.

📲 WhatsApp +504 3151-7755`;
  }
  function openSavedQuotes(){
    let q='';
    openModal(`<div class="modal-head"><h3>Cotizaciones guardadas</h3><button class="close">×</button></div><div class="modal-body saved-quotes-body"><div class="card-box saved-quotes-head"><b>Buscar cotización</b><span>Busca por cliente, teléfono, código, producto o estado. Puedes recordar al cliente o pasarla a venta.</span><div class="searchbar"><span class="icon">⌕</span><input id="quoteSearch" placeholder="Nombre, teléfono, código, estado o producto..."></div></div><div id="savedQuotesList" class="saved-quotes-list"></div></div>`,true);
    function draw(){
      const term=q.toLowerCase().trim();
      const list=(state.quotes||[]).filter(x=>{
        const hay=[x.id,x.client,x.phone,x.department,x.municipality,x.company,x.status,(x.items||[]).map(i=>i.name).join(' ')].join(' ').toLowerCase();
        return !term || hay.includes(term);
      });
      $('#savedQuotesList',modalRoot).innerHTML=list.map(x=>{const c=calc(x); return `<div class="saved-quote-card"><div class="saved-quote-main"><b>${escapeHtml(x.client||'Cliente sin nombre')}</b><span>${escapeHtml(x.phone||'Sin teléfono')} · ${escapeHtml(x.id||'COT')}</span><small>${escapeHtml(quoteSummaryText(x))}</small></div><div class="saved-quote-total"><span>Total</span><b>${money(c.total)}</b></div><label class="quote-status-inline"><span>Estado</span><select data-qstatus="${escapeHtml(x.id)}">${statusOptions(x.status||'Cotizado')}</select></label><div class="saved-quote-actions"><button class="btn small secondary" data-openquote="${escapeHtml(x.id)}">Abrir</button><button class="btn small" data-salequote="${escapeHtml(x.id)}">Pasar a venta</button><button class="btn small ghost" data-remindquote="${escapeHtml(x.id)}">Recordar</button><button class="btn small ghost" data-waquote="${escapeHtml(x.id)}">WhatsApp</button><button class="btn small danger" data-delquote="${escapeHtml(x.id)}">Borrar</button></div></div>`}).join('')||'<div class="empty-state">Todavía no hay cotizaciones guardadas.</div>';
      $$('[data-qstatus]',modalRoot).forEach(sel=>sel.onchange=()=>{const x=state.quotes.find(y=>y.id===sel.dataset.qstatus); if(x){x.status=sel.value; save(); toast('Estado actualizado.')}});
      $$('[data-openquote]',modalRoot).forEach(b=>b.onclick=()=>{const x=state.quotes.find(y=>y.id===b.dataset.openquote); if(!x)return; quote=SDCStore.clone(x); quote.editingId=x.id; openModal(quoteModalHTML(false),true); bindQuoteCommon(false); toast('Cotización abierta para modificar.');});
      $$('[data-salequote]',modalRoot).forEach(b=>b.onclick=()=>{const x=state.quotes.find(y=>y.id===b.dataset.salequote); if(!x)return; closeModal(); openSale(null,x); toast('Cotización pasada a venta.');});
      $$('[data-waquote]',modalRoot).forEach(b=>b.onclick=()=>{const x=state.quotes.find(y=>y.id===b.dataset.waquote); if(!x)return; quote=SDCStore.clone(x); openModal(quoteModalHTML(false),true); bindQuoteCommon(false); sendWhatsAppText(false);});
      $$('[data-remindquote]',modalRoot).forEach(b=>b.onclick=()=>{const x=state.quotes.find(y=>y.id===b.dataset.remindquote); if(!x)return; openWhatsApp(x.phone||'',reminderText(x));});
      $$('[data-delquote]',modalRoot).forEach(b=>b.onclick=()=>{if(!confirm('¿Borrar esta cotización guardada?'))return; state.quotes=state.quotes.filter(x=>x.id!==b.dataset.delquote); save(); draw(); toast('Cotización borrada.');});
    }
    $('#quoteSearch',modalRoot).oninput=e=>{q=e.target.value;draw()}; draw();
  }

  function openProfit(){
    let selected='';
    const rowsBase=state.products.map(p=>({
      p,
      stock:productStock(p),
      unitCost:+p.cost||0,
      unitPrice:+p.price||0,
      unitProfit:(+p.price||0)-(+p.cost||0),
      totalProfit:((+p.price||0)-(+p.cost||0))*productStock(p)
    }));
    const cats=['Todas',...new Set(state.products.flatMap(p=>parseTags(categoryText(p)||p.categories||'')))];
    openModal(`<div class="modal-head"><h3>Ganancias</h3><button class="close">×</button></div><div class="modal-body profit-modal-v147"><div class="card-box profit-toolbar-v147"><label><span class="label">Categoría</span><select id="profitCategory" class="select">${cats.map(cat=>`<option value="${escapeHtml(cat)}">${escapeHtml(cat)}</option>`).join('')}</select></label><div class="profit-summary-v147" id="profitSummary"></div></div><div class="table-wrap-v147"><table class="profit-table profit-table-v147"><thead><tr><th>Producto</th><th>Precio unidad</th><th>Precio venta</th><th>Precio ganancia</th><th>Stock</th><th>Ganancia total</th></tr></thead><tbody id="profitBody"></tbody></table></div></div>`,true);
    function draw(){
      selected=$('#profitCategory',modalRoot)?.value||'Todas';
      const filtered=rowsBase.filter(r=>selected==='Todas' || parseTags(categoryText(r.p)||r.p.categories||'').some(cat=>cat.toLowerCase()===selected.toLowerCase()));
      const total=filtered.reduce((a,r)=>a+r.totalProfit,0);
      const units=filtered.reduce((a,r)=>a+r.stock,0);
      const low=filtered.filter(r=>r.unitProfit>0 && r.unitProfit<10).length;
      $('#profitSummary',modalRoot).innerHTML=`<div><span>Productos</span><b>${num(filtered.length)}</b></div><div><span>Unidades</span><b>${num(units)}</b></div><div><span>Ganancia estimada</span><b>${moneyPrivate(total)}</b></div><div><span>Margen bajo</span><b>${num(low)}</b></div>`;
      $('#profitBody',modalRoot).innerHTML=filtered.map(r=>`<tr class="${r.unitProfit>0&&r.unitProfit<10?'low-profit-row':''}"><td><strong>${escapeHtml(r.p.name)}</strong><small>${escapeHtml(firstTag(r.p)||'Sin categoría')}</small></td><td>${moneyPrivate(r.unitCost)}</td><td>${moneyPrivate(r.unitPrice)}</td><td>${moneyPrivate(r.unitProfit)}</td><td>${num(r.stock)}</td><td>${moneyPrivate(r.totalProfit)}</td></tr>`).join('') || '<tr><td colspan="6">Sin productos en esta categoría.</td></tr>';
    }
    $('#profitCategory',modalRoot).onchange=draw;
    draw();
  }
  function saleProfit(s){return (s.items||[]).reduce((a,it)=>a+(itemTotal(it)-(Number(it.cost||0)*Number(it.qty||0))),0)}
  function isTodayISO(date){const d=new Date(date||Date.now()), n=new Date(); return d.getFullYear()===n.getFullYear()&&d.getMonth()===n.getMonth()&&d.getDate()===n.getDate()}
  function openReceipts(){
    const sales=state.sales||[]; const today=sales.filter(s=>isTodayISO(s.date));
    const total=today.reduce((a,s)=>a+(s.total||calc(s).total),0); const profit=today.reduce((a,s)=>a+saleProfit(s),0); const expenses=(state.expenses||[]).filter(x=>isTodayISO(x.date)).reduce((a,x)=>a+(+x.amount||0),0); const net=profit-expenses; const pending=sales.filter(s=>/pendiente|recibir/i.test(s.status||s.paymentStatus||'')).reduce((a,s)=>a+(s.total||calc(s).total),0);
    openModal(`<div class="modal-head"><h3>Caja / recibos</h3><button class="close">×</button></div><div class="modal-body receipts-v22"><div class="cash-stats"><div><span>Ventas</span><b>${money(total)}</b></div><div><span>Ganancia bruta</span><b>${moneyPrivate(profit)}</b></div><div><span>Gastos hoy</span><b>${money(expenses)}</b></div><div><span>Ganancia neta</span><b>${moneyPrivate(net)}</b></div><div><span>Facturas</span><b>${num(today.length)}</b></div><div><span>Pendiente</span><b>${money(pending)}</b></div></div><div class="modal-actions" style="position:static"><button class="btn" data-action="dailyClose">Cierre del día</button><button class="btn secondary" data-action="expenses">Registrar gasto</button></div><div class="cart-list">${sales.map(s=>`<div class="cart-row"><div><b>${escapeHtml(s.client||'Cliente')}</b><br><span>${escapeHtml(s.id)} · ${money(s.total||calc(s).total)} · ${escapeHtml(s.status||s.paymentStatus||'Venta')}</span></div><button class="btn small secondary" data-openreceipt="${s.id}">Editar</button></div>`).join('')||'<div class="empty-state">Todavía no hay ventas registradas.</div>'}</div></div>`,true);
    $$('[data-action="dailyClose"]',modalRoot).forEach(b=>b.onclick=openDailyClose);
    $$('[data-openreceipt]',modalRoot).forEach(b=>b.onclick=()=>{const s=state.sales.find(x=>x.id===b.dataset.openreceipt); if(s){saleDraft=SDCStore.clone(s); saleDraft.editingId=s.id; openModal(quoteModalHTML(true),true); bindQuoteCommon(true); toast('Puedes editar esta factura y guardar cambios.')}});
  }
  function openDailyClose(){
    const today=(state.sales||[]).filter(s=>isTodayISO(s.date));
    const todayExpenses=(state.expenses||[]).filter(x=>isTodayISO(x.date));
    const total=today.reduce((a,s)=>a+(s.total||calc(s).total),0);
    const products=today.reduce((a,s)=>a+calc(s).products,0);
    const delivery=today.reduce((a,s)=>a+calc(s).delivery,0);
    const profit=today.reduce((a,s)=>a+saleProfit(s),0);
    const expenses=todayExpenses.reduce((a,x)=>a+(+x.amount||0),0);
    const net=profit-expenses;
    const codTotal=today.filter(s=>s.cod).reduce((a,s)=>a+(s.total||calc(s).total),0);
    const normalTotal=total-codTotal;
    const txt=`CIERRE DEL DÍA - SD COMAYAGUA\nFecha: ${nowHN()}\nVentas: ${today.length}\nProductos vendidos: ${money(products)}\nEnvío/comisión: ${money(delivery)}\nTotal vendido: ${money(total)}\nNormal/prepago: ${money(normalTotal)}\nPagar al recibir: ${money(codTotal)}\nGastos del día: ${money(expenses)}\nGanancia bruta estimada: ${money(profit)}\nGANANCIA NETA: ${money(net)}\n\nGastos:\n${todayExpenses.map(x=>`- ${x.name}: ${money(x.amount)}`).join('\n')||'- Sin gastos registrados'}`;
    openModal(`<div class="modal-head"><h3>Cierre del día</h3><button class="close">×</button></div><div class="modal-body daily-close-v26"><div class="cash-stats"><div><span>Ventas</span><b>${money(total)}</b></div><div><span>Facturas</span><b>${num(today.length)}</b></div><div><span>Ganancia bruta</span><b>${moneyPrivate(profit)}</b></div><div><span>Gastos</span><b>${money(expenses)}</b></div><div><span>Ganancia neta</span><b>${moneyPrivate(net)}</b></div><div><span>Al recibir</span><b>${money(codTotal)}</b></div></div><textarea class="textarea" id="closeText">${escapeHtml(txt)}</textarea><div class="modal-actions" style="position:static"><button class="btn" id="saveClose">Guardar cierre</button><button class="btn secondary" id="copyClose">Copiar resumen</button><button class="btn ghost" id="openExpensesFromClose">Gastos</button></div></div>`,true);
    $('#copyClose').onclick=()=>{navigator.clipboard?.writeText($('#closeText').value); toast('Resumen copiado.');};
    $('#openExpensesFromClose').onclick=openExpenses;
    $('#saveClose').onclick=()=>{state.closings.unshift({id:'CIERRE-'+Date.now(),date:new Date().toISOString(),total,profit,expenses,net,count:today.length,text:$('#closeText').value}); save(); SDCStore.saveBackup(state,'Cierre del día'); toast('Cierre guardado.');};
  }

  function clientKeyFromDoc(doc){const phone=cleanPhone(doc?.phone||'').slice(-8); return phone || slugFile(doc?.client||'cliente');}
  function saveClientFromDoc(doc){
    hydrateState();
    const has=String(doc?.client||doc?.phone||doc?.reference||'').trim(); if(!has)return;
    const key=clientKeyFromDoc(doc); const c=calc(doc); const ix=state.clients.findIndex(x=>x.key===key || (x.phone&&cleanPhone(x.phone).slice(-8)===cleanPhone(doc.phone).slice(-8)));
    const item={key,name:doc.client||'Cliente',phone:doc.phone||'',department:doc.department||'',municipality:doc.municipality||'',reference:doc.reference||'',company:doc.company||'',lastTotal:c.total,lastDate:new Date().toISOString(),notes:''};
    if(ix>=0) state.clients[ix]={...state.clients[ix],...item}; else state.clients.unshift(item);
  }
  function applyClientToDoc(client,kind){
    const doc=kind==='sale'?saleDraft:quote; if(!doc)return;
    doc.client=client.name||''; doc.phone=client.phone||''; doc.department=client.department||'Comayagua'; doc.municipality=client.municipality||'Comayagua'; doc.reference=client.reference||''; doc.company=client.company||doc.company||'Forza';
    openModal(quoteModalHTML(kind==='sale'),true); bindQuoteCommon(kind==='sale'); toast('Cliente cargado en la cotización.');
  }
  function openClients(kind=null){
    hydrateState(); let q='';
    openModal(`<div class="modal-head"><h3>Clientes guardados</h3><button class="close">×</button></div><div class="modal-body clients-v22"><div class="card-box"><b>Agenda de clientes</b><span>Se llena automáticamente al guardar cotizaciones o ventas.</span><div class="searchbar"><span class="icon">⌕</span><input id="clientSearch" placeholder="Buscar nombre, teléfono, municipio o referencia..."></div></div><div id="clientsList"></div></div>`,true);
    function draw(){const term=q.toLowerCase().trim(); const list=(state.clients||[]).filter(c=>!term || [c.name,c.phone,c.department,c.municipality,c.reference,c.company].join(' ').toLowerCase().includes(term)); $('#clientsList').innerHTML=list.map(c=>`<div class="client-card-v22"><div><b>${escapeHtml(c.name||'Cliente')}</b><span>${escapeHtml(c.phone||'Sin teléfono')} · ${escapeHtml([c.department,c.municipality].filter(Boolean).join(' / ')||'Sin ubicación')}</span><small>${escapeHtml(c.reference||'Sin referencia')} · Último total ${money(c.lastTotal||0)}</small></div><div class="client-actions-v22">${kind?`<button class="btn small" data-useclient="${escapeHtml(c.key)}">Usar</button>`:''}<button class="btn small secondary" data-remindclient="${escapeHtml(c.key)}">WhatsApp</button><button class="btn small danger" data-delclient="${escapeHtml(c.key)}">Borrar</button></div></div>`).join('')||'<div class="empty-state">Aún no hay clientes guardados.</div>'; $$('[data-useclient]').forEach(b=>b.onclick=()=>{const c=state.clients.find(x=>x.key===b.dataset.useclient); if(c)applyClientToDoc(c,kind)}); $$('[data-remindclient]').forEach(b=>b.onclick=()=>{const c=state.clients.find(x=>x.key===b.dataset.remindclient); if(c)openWhatsApp(c.phone||'',`Hola ${c.name||''}, le saluda SD COMAYAGUA. ¿Desea que le ayudemos con algún producto o cotización?`)}); $$('[data-delclient]').forEach(b=>b.onclick=()=>{if(!confirm('¿Borrar este cliente guardado?'))return; state.clients=state.clients.filter(x=>x.key!==b.dataset.delclient); save(); draw();});}
    $('#clientSearch').oninput=e=>{q=e.target.value;draw()}; draw();
  }
  function marketplaceText(p){
    const title=`${p.name} - Disponible en Comayagua`;
    return `FACEBOOK MARKETPLACE\nTítulo: ${title}\nPrecio: ${money(productQuotedUnit(p))}\nEstado: Nuevo\nCategoría sugerida: ${autoProductSpecs(p).categoria}\n\nDescripción:\n${productDescription(p)}\n\nDatos rápidos:\n• Código: ${p.id}\n• Depósito / Tigo Money: Lps.110\n• Pagar al Recibir: Lps.110 + comisión 10%\n• Envío Local: por definir según zona\n• WhatsApp: +504 3151-7755\n\nEtiquetas Facebook:\nComayagua, Honduras, tienda online, envío a domicilio, SD Comayagua, productos gamer, accesorios para celular\n\nINSTAGRAM:\n${p.name} disponible 🔥\nPrecio: ${money(productQuotedUnit(p))}\nDepósito Lps.110 · Pagar al Recibir Lps.110 + 10% · Local por definir\nConsulta por WhatsApp +504 3151-7755\n\n#Comayagua #Honduras #SDComayagua #TiendaOnline #GamerHonduras #AccesoriosCelular #EnviosHonduras`;
  }
  function catalogText(p){
    return `WHATSAPP CATÁLOGO\nNombre: ${p.name}\nPrecio: ${money(productQuotedUnit(p))}\nPrecio de oferta: ${money(productQuotedUnit(p))}\nCódigo: ${p.id}\nCategoría: ${autoProductSpecs(p).categoria}\nPaís de origen: Honduras\n\nDescripción:\n${productDescription(p)}\n\nDepósito / Tigo Money: Lps.110. Pagar al Recibir: Lps.110 + comisión del 10%. Envío Local: Por definir. WhatsApp: +504 3151-7755`;
  }
  function openMarketingText(id){
    const p=productById(id); if(!p)return;
    const text=`${marketplaceText(p)}\n\n------------------------------\n\n${catalogText(p)}`;
    openModal(`<div class="modal-head"><h3>Textos para vender</h3><button class="close">×</button></div><div class="modal-body"><div class="card-box"><h4>${escapeHtml(p.name)}</h4><p style="color:#b8c8d8">Texto listo para Marketplace, Instagram y WhatsApp Catálogo.</p><textarea class="textarea" id="marketingText" style="min-height:360px">${escapeHtml(text)}</textarea><div class="modal-actions" style="position:static"><button class="btn" id="copyMarketing">Copiar todo</button><button class="btn secondary" id="waMarketing">Enviar WhatsApp</button></div></div></div>`,true);
    $('#copyMarketing').onclick=()=>{navigator.clipboard?.writeText($('#marketingText').value); toast('Texto copiado.');};
    $('#waMarketing').onclick=()=>openWhatsApp('', $('#marketingText').value);
  }
  async function sendCompleteQuote(){
    if(!quote.items.length)return toast('Agrega productos primero.');
    saveCurrentQuote();
    await shareDocPhoto(false);
  }

  function toggleCaptureClean(){
    state.settings.captureClean=!state.settings.captureClean;
    if(state.settings.captureClean) state.settings.cardView='client';
    save(); applyAppearance(); render(); toast(state.settings.captureClean?'Modo captura activado. Toque SALIR o CAPTURA para volver a la vista normal.':'Captura desactivada. Ya volvió a la vista normal.');
  }

  function toggleMoneyLock(){
    if(state.settings.moneyLocked){
      const pin=prompt('Ingresa la clave para mostrar ganancias:');
      if(pin!==(state.settings.accessKey||'199311')) return toast('Clave incorrecta.');
      state.settings.moneyLocked=false;
    }else{
      state.settings.moneyLocked=true;
    }
    save(); applyAppearance(); render(); toast(state.settings.moneyLocked?'Ganancias ocultas.':'Ganancias visibles.');
  }
  function autoFillClientByPhone(doc,isSale){
    const p=cleanPhone(doc.phone||'').slice(-8); if(p.length<8 || doc.__clientAutofilled===p) return;
    const c=(state.clients||[]).find(x=>cleanPhone(x.phone||'').slice(-8)===p);
    if(!c) return;
    doc.__clientAutofilled=p;
    doc.client=doc.client||c.name||''; doc.department=c.department||doc.department; doc.municipality=c.municipality||doc.municipality; doc.reference=doc.reference||c.reference||''; doc.company=c.company||doc.company;
    toast('Cliente frecuente cargado automáticamente.');
  }
  function openQuickSale(){
    const doc=emptySale(); saleDraft=doc;
    openModal(`<div class="modal-head"><h3>Venta rápida</h3><button class="close">×</button></div><div class="modal-body quick-sale-v26"><div class="card-box"><b>Venta rápida desde celular</b><span>Producto, color, cantidad y tipo de envío. Los datos del cliente son opcionales.</span><div class="searchbar"><span class="icon">⌕</span><input id="quickSearch" placeholder="Buscar producto..."></div><div id="quickList" class="picker-list"></div></div><div class="card-box"><label><span class="label">Cantidad</span><input id="quickQty" class="input" type="number" inputmode="numeric" value="1" min="1"></label><div id="quickColorBox" class="quick-color-box-v86"></div><label><span class="label">Tipo de cobro</span><select id="quickType" class="select"><option value="Normal">Depósito Lps.110</option><option value="COD">Pagar al Recibir Lps.110 + 10%</option><option value="Local">Envío Local: Por definir</option></select></label><label><span class="label">Envío Lps.</span><input id="quickShip" class="input" type="number" inputmode="numeric" value="110" min="0" placeholder="Escriba el costo"></label><label><span class="label">Teléfono cliente opcional</span><input id="quickPhone" class="input" inputmode="tel" placeholder="31517755"></label><label><span class="label">Cliente opcional</span><input id="quickClient" class="input" placeholder="Nombre"></label><div id="quickSummary" class="summary"></div><button class="btn full" id="quickFinish">Registrar venta rápida</button></div></div>`,true);
    let selected=null, q='';
    function selectedQuickColor(){const p=productById(selected); return hasColorStock(p)?($('#quickColor',modalRoot)?.value||defaultColorForProduct(p)):'';}
    function drawQuickColors(){
      const box=$('#quickColorBox',modalRoot); if(!box) return;
      const p=productById(selected); const rows=productColorRows(p).filter(r=>Number(r.qty)>0);
      if(!p || !rows.length){box.innerHTML=''; return;}
      const current=$('#quickColor',modalRoot)?.value || defaultColorForProduct(p);
      box.innerHTML=`<label><span class="label">Color disponible</span><select id="quickColor" class="select">${rows.map(r=>`<option value="${escapeHtml(r.name)}" ${colorKey(current)===colorKey(r.name)?'selected':''}>${escapeHtml(r.name)} · ${num(r.qty)} disponibles</option>`).join('')}</select></label>`;
      $('#quickColor',modalRoot).onchange=drawSummary;
    }
    function drawList(){
      const term=q.toLowerCase();
      const list=activeProducts().filter(p=>!term||[p.name,p.id,categoryText(p)].join(' ').toLowerCase().includes(term)).slice(0,30);
      $('#quickList').innerHTML=list.map(p=>`<div class="picker-item ${selected===p.id?'active':''}"><img loading="lazy" decoding="async" src="${escapeHtml(productImage(p))}" onerror="this.onerror=null;this.src='${escapeHtml(placeholderFor(p))}'"><div><b>${escapeHtml(p.name)}</b><span>${money(productQuotedUnit(p))} · Stock ${num(productStock(p))}${colorStockSummary(p,2)?` · ${escapeHtml(colorStockSummary(p,2))}`:''}</span></div><button class="btn small" data-qselect="${escapeHtml(p.id)}">Elegir</button></div>`).join('');
      $$('[data-qselect]',modalRoot).forEach(b=>b.onclick=()=>{selected=b.dataset.qselect; drawList(); drawQuickColors(); drawSummary();});
    }
    function drawSummary(){
      const p=productById(selected); const qty=Math.max(1,+($('#quickQty')?.value||1));
      if(!p){$('#quickSummary').innerHTML='<div class="empty-state">Elegí un producto.</div>';return;}
      const color=selectedQuickColor();
      const products=productItemsTotal(p,qty); const type=$('#quickType').value; const cod=type==='COD'; const shipping=type==='COD'?SHIPPING.cod.fee:type==='Local'?(+$('#quickShip').value||0):SHIPPING.normal.fee; const total=cod?codGrandTotal(products+shipping):products+shipping; const offer=promoLabelForQty(p,qty); const shipName=type==='Local'?'Envío local':type==='COD'?'Pagar al recibir':'Depósito';
      const colorLine=color?`<div class="summary-row"><b>Color</b><b>${escapeHtml(color)} · ${num(colorQtyAvailable(p,color))} disp.</b></div>`:'';
      $('#quickSummary').innerHTML=`${colorLine}<div class="summary-row"><b>Producto</b><b>${money(products)}</b></div><div class="summary-row"><b>${shipName}</b><b>${money(shipping)}</b></div>${offer?`<div class="promo-applied-v26">🎁 ${escapeHtml(offer)}</div>`:''}<div class="summary-total"><b>Total</b><b>${money(total)}</b></div>`;
    }
    $('#quickSearch').oninput=e=>{q=e.target.value;drawList()}; $('#quickQty').oninput=drawSummary; $('#quickShip').oninput=drawSummary; $('#quickType').onchange=()=>{const t=$('#quickType').value; $('#quickShip').value=t==='COD'?SHIPPING.cod.fee:t==='Local'?0:SHIPPING.normal.fee; drawSummary();}; drawList(); drawQuickColors(); drawSummary();
    $('#quickFinish').onclick=()=>{const p=productById(selected); if(!p)return toast('Elegí un producto.'); const qty=Math.max(1,+$('#quickQty').value||1); const color=selectedQuickColor(); if(hasColorStock(p) && !color)return toast('Elegí el color.'); saleDraft=emptySale(); saleDraft.client=$('#quickClient').value.trim(); saleDraft.phone=$('#quickPhone').value.trim(); saleDraft.shippingType=$('#quickType').value; saleDraft.cod=saleDraft.shippingType==='COD'; saleDraft.shipping=+$('#quickShip').value||0; applyShippingPreset(saleDraft,saleDraft.shippingType,false); saleDraft.shipping=+$('#quickShip').value||0; saleDraft.status=isCodDoc(saleDraft)?'Pagar al recibir':isLocalDoc(saleDraft)?'Entrega local':'Vendido'; saleDraft.items=[{id:p.id,name:p.name,price:+p.price||0,cost:+p.cost||0,qty,color,image:productImage(p)}]; finishSale(); closeModal(); render();};
  }
  function openExpenses(){
    hydrateState(); let today=(state.expenses||[]).filter(x=>isTodayISO(x.date)); const total=today.reduce((a,x)=>a+(+x.amount||0),0);
    openModal(`<div class="modal-head"><h3>Gastos del negocio</h3><button class="close">×</button></div><div class="modal-body expenses-v26"><div class="cash-stats"><div><span>Gastos hoy</span><b>${money(total)}</b></div><div><span>Registros</span><b>${num(today.length)}</b></div></div><div class="card-box"><label><span class="label">Concepto</span><input id="expenseName" class="input" placeholder="Empaque, transporte, publicidad..."></label><label><span class="label">Monto Lps.</span><input id="expenseAmount" class="input" type="number" inputmode="numeric" placeholder="0"></label><button class="btn full" id="saveExpense">Guardar gasto</button></div><div class="cart-list" id="expenseList"></div></div>`,true);
    function draw(){today=(state.expenses||[]).filter(x=>isTodayISO(x.date)); $('#expenseList').innerHTML=today.map(x=>`<div class="cart-row"><div><b>${escapeHtml(x.name)}</b><br><span>${new Date(x.date).toLocaleTimeString('es-HN',{hour:'numeric',minute:'2-digit'})} · ${money(x.amount)}</span></div><button class="btn small danger" data-delexp="${x.id}">Borrar</button></div>`).join('')||'<div class="empty-state">Sin gastos hoy.</div>'; $$('[data-delexp]',modalRoot).forEach(b=>b.onclick=()=>{state.expenses=state.expenses.filter(x=>x.id!==b.dataset.delexp); save(); draw();});}
    $('#saveExpense').onclick=()=>{const name=$('#expenseName').value.trim()||'Gasto'; const amount=+$('#expenseAmount').value||0; if(amount<=0)return toast('Escribe el monto del gasto.'); state.expenses.unshift({id:'GASTO-'+Date.now(),name,amount,date:new Date().toISOString()}); save(); toast('Gasto guardado.'); openExpenses();}; draw();
  }
  function shortReceiptVariant(doc,type){
    const d=SDCStore.clone(doc||{});
    const key=type==='COD'?'COD':'Normal';
    applyShippingPreset(d,key,true);
    d.shipping=key==='COD'?SHIPPING.cod.fee:SHIPPING.normal.fee;
    d.cod=key==='COD';
    d.shippingType=key;
    d.receiptVariantLabel=key==='COD'?'Pagar al recibir':'Envío normal';
    return d;
  }
  function shortReceiptLinesHTML(doc){
    return (doc.items||[]).map((it,idx)=>{
      const qty=Math.max(1,+it.qty||1);
      const color=selectedColorLabel(it);
      const total=itemTotal(it);
      const unit=qty?total/qty:total;
      const qtyText=`${num(qty)} ${qty===1?'unidad':'unidades'}`;
      return `<article class="sdc208-line">
        <div class="sdc208-line-index">${num(idx+1)}</div>
        <div class="sdc208-line-copy">
          <b>${escapeHtml(it.name)}</b>
          <span>${qtyText} · ${money(unit)} c/u</span>
          ${color?`<em>Color: ${escapeHtml(color)}</em>`:''}
        </div>
        <strong>${money(total)}</strong>
      </article>`;
    }).join('');
  }
  function shortReceiptCardHTML(doc){
    const c=calc(doc);
    const variant=doc.receiptVariantLabel || shippingLabel(doc);
    const itemCount=(doc.items||[]).reduce((a,it)=>a+Math.max(1,+it.qty||1),0);
    const client=String(doc.client||'Cliente').trim()||'Cliente';
    return `<div class="short-receipt sdc208-ticket" id="shortReceiptCard">
      <header class="sdc208-head">
        <div class="sdc208-logo"><img class="receipt-logo-inline" src="${exportLogoSrc()}" alt="SD Comayagua" loading="eager" decoding="sync"></div>
        <div class="sdc208-head-copy">
          <span>SD COMAYAGUA</span>
          <h2>Recibo corto</h2>
          <p>${escapeHtml(nowHN())}</p>
        </div>
        <div class="sdc208-mode">${escapeHtml(variant)}</div>
      </header>
      <section class="sdc208-meta">
        <div><span>Cliente</span><b>${escapeHtml(client)}</b></div>
        <div><span>Artículos</span><b>${num(itemCount)}</b></div>
      </section>
      <section class="sdc208-section"><span>Detalle del pedido</span></section>
      <section class="sdc208-lines">${shortReceiptLinesHTML(doc)||'<div class="sdc208-empty">Sin productos agregados.</div>'}</section>
      <section class="sdc208-summary">
        <div><span>Productos</span><b>${money(c.products)}</b></div>
        <div><span>${escapeHtml(shippingLabel(doc))}</span><b>${money(c.shipping)}</b></div>
        ${c.commission?`<div><span>Comisión</span><b>${money(c.commission)}</b></div>`:''}
      </section>
      <section class="sdc208-grand">
        <span>Total a pagar</span>
        <b>${money(c.total)}</b>
      </section>
      <footer class="sdc208-foot">
        <span>Confirme disponibilidad, entrega y pago antes de cerrar el pedido.</span>
        <b>WhatsApp +504 3151-7755</b>
      </footer>
    </div>`;
  }
  function shortReceiptExportCSS(){return `
    .shortReceiptExportHost{position:fixed;left:-10000px;top:0;width:600px;padding:24px;background:#eaf3fb;z-index:-1}
    .shortReceiptExportHost *{box-sizing:border-box}
    .shortReceiptExportHost .sdc208-ticket{width:540px;max-width:540px;margin:0 auto;padding:20px;border-radius:32px;background:#ffffff;color:#07192f;border:1px solid #d8e7f6;box-shadow:0 20px 52px rgba(7,26,53,.10);overflow:hidden;font-family:Barlow,Arial,sans-serif}
    .shortReceiptExportHost .sdc208-head{display:grid;grid-template-columns:68px minmax(0,1fr);grid-template-areas:"logo copy" "mode mode";gap:14px;align-items:center;padding:18px;border-radius:27px;background:linear-gradient(135deg,#071a35 0%,#0b63ce 72%,#0a7cf2 100%);color:#fff}
    .shortReceiptExportHost .sdc208-logo{grid-area:logo;width:68px;height:68px;border-radius:21px;background:#fff;display:grid;place-items:center;border:1px solid rgba(255,255,255,.7);box-shadow:0 16px 32px rgba(0,0,0,.16)}
    .shortReceiptExportHost .sdc208-logo img{width:52px;height:52px;object-fit:contain}
    .shortReceiptExportHost .sdc208-head-copy{grid-area:copy;min-width:0}
    .shortReceiptExportHost .sdc208-head-copy span{display:block;color:#bfe0ff;font-size:13px;line-height:1;font-weight:950;letter-spacing:.16em;text-transform:uppercase}
    .shortReceiptExportHost .sdc208-head-copy h2{margin:8px 0 5px;color:#fff;font-size:34px;line-height:.92;letter-spacing:-.05em}
    .shortReceiptExportHost .sdc208-head-copy p{margin:0;color:#dcecff;font-size:15px;line-height:1.15;font-weight:850}
    .shortReceiptExportHost .sdc208-mode{grid-area:mode;justify-self:start;display:inline-flex;align-items:center;min-height:42px;padding:0 18px;border-radius:999px;background:#fff;color:#0b63ce;font-size:14px;font-weight:950;box-shadow:0 12px 24px rgba(0,0,0,.11)}
    .shortReceiptExportHost .sdc208-meta{display:grid;grid-template-columns:minmax(0,1fr) 112px;gap:10px;margin:14px 0}
    .shortReceiptExportHost .sdc208-meta div{padding:15px;border-radius:22px;background:#f7fbff;border:1px solid #dbe8f6}
    .shortReceiptExportHost .sdc208-meta span,.shortReceiptExportHost .sdc208-summary span,.shortReceiptExportHost .sdc208-grand span{display:block;color:#637d96;font-size:11px;line-height:1;font-weight:950;letter-spacing:.11em;text-transform:uppercase;margin-bottom:7px}
    .shortReceiptExportHost .sdc208-meta b{display:block;color:#07192f;font-size:22px;line-height:1.08;word-break:break-word}
    .shortReceiptExportHost .sdc208-section{margin:9px 0 11px;display:flex;align-items:center;gap:10px}
    .shortReceiptExportHost .sdc208-section::after{content:"";flex:1;height:1px;background:#dbe8f6}
    .shortReceiptExportHost .sdc208-section span{color:#07192f;font-size:14px;font-weight:950;letter-spacing:.12em;text-transform:uppercase}
    .shortReceiptExportHost .sdc208-lines{display:grid;gap:10px;margin-bottom:16px}
    .shortReceiptExportHost .sdc208-line{display:grid;grid-template-columns:38px minmax(0,1fr);gap:11px;align-items:start;padding:14px;border-radius:22px;background:#fff;border:1px solid #dbe8f6;box-shadow:0 8px 20px rgba(7,26,53,.035)}
    .shortReceiptExportHost .sdc208-line-index{width:38px;height:38px;display:grid;place-items:center;border-radius:14px;background:#eef6ff;color:#0b63ce;font-size:14px;font-weight:950}
    .shortReceiptExportHost .sdc208-line-copy{display:grid;gap:4px;min-width:0}
    .shortReceiptExportHost .sdc208-line-copy b{display:block;color:#07192f;font-size:18px;line-height:1.12;word-break:break-word}
    .shortReceiptExportHost .sdc208-line-copy span,.shortReceiptExportHost .sdc208-line-copy em{display:block;color:#657c95;font-size:13px;line-height:1.2;font-weight:850;font-style:normal}
    .shortReceiptExportHost .sdc208-line strong{grid-column:2;justify-self:end;display:block;color:#d61c3b;font-size:23px;line-height:1;font-weight:950;white-space:nowrap;padding-left:8px;margin-top:4px}
    .shortReceiptExportHost .sdc208-empty{padding:18px;border-radius:18px;background:#f7fbff;border:1px solid #dbe8f6;color:#667f98;text-align:center;font-weight:850}
    .shortReceiptExportHost .sdc208-summary{display:grid;gap:8px;margin:0 0 14px;padding:10px;border-radius:24px;background:#f3f8ff;border:1px solid #dbe8f6}
    .shortReceiptExportHost .sdc208-summary div{min-height:54px;display:flex;align-items:center;justify-content:space-between;gap:10px;padding:0 14px;border-radius:17px;background:#fff;border:1px solid #e2edf8}
    .shortReceiptExportHost .sdc208-summary b{color:#07192f;font-size:19px;line-height:1;white-space:nowrap}
    .shortReceiptExportHost .sdc208-grand{min-height:88px;display:flex;align-items:center;justify-content:space-between;gap:16px;padding:18px 20px;border-radius:26px;background:linear-gradient(135deg,#071a35,#0b63ce);color:#fff;box-shadow:0 16px 36px rgba(11,99,206,.20)}
    .shortReceiptExportHost .sdc208-grand span{margin:0;color:#dbeafe}
    .shortReceiptExportHost .sdc208-grand b{color:#fff;font-size:39px;line-height:.92;letter-spacing:-.05em;white-space:nowrap}
    .shortReceiptExportHost .sdc208-foot{margin-top:14px;display:grid;gap:10px}
    .shortReceiptExportHost .sdc208-foot span{display:block;padding:14px;border-radius:20px;background:#fbfdff;border:1px dashed #cfe3fb;color:#667f98;text-align:center;font-size:13px;line-height:1.3;font-weight:850}
    .shortReceiptExportHost .sdc208-foot b{display:block;padding:15px;border-radius:20px;background:#071a35;color:#fff;text-align:center;font-size:17px;line-height:1;font-weight:950}
  `}
  function shortReceiptText(doc){
    const c=calc(doc);
    const isCod=isCodDoc(doc);
    const mode=isCod?'🚚 *ENVÍO PAGAR AL RECIBIR*':'🚚 *ENVÍO NORMAL*';
    const client=String(doc.client||'Cliente').trim()||'Cliente';
    const itemCount=(doc.items||[]).reduce((a,it)=>a+Math.max(1,+it.qty||1),0);
    return [
      '🧾 *FACTURA CORTA COMERCIAL*',
      '━━━━━━━━━━━━━━━━━━━━',
      mode,
      '',
      '🏪 *SD COMAYAGUA*',
      `👤 Cliente: *${client}*`,
      `📦 Artículos: *${num(itemCount)}*`,
      '',
      '🛍️ *PRODUCTOS*',
      ...(doc.items||[]).map((it,idx)=>{
        const qty=Math.max(1,+it.qty||1);
        const total=itemTotal(it);
        const unit=qty?total/qty:total;
        return `${idx+1}️⃣ *${it.name}*
   • Cantidad: *${num(qty)} ${qty===1?'unidad':'unidades'}*
   • Precio c/u: *${money(unit)}*${selectedColorLabel(it)?`\n   • Color: *${selectedColorLabel(it)}*`:''}
   • Total: *${money(total)}*`;
      }),
      '',
      '💰 *RESUMEN*',
      `• Productos: *${money(c.products)}*`,
      `• ${shippingLabel(doc)}: *${money(c.shipping)}*`,
      ...(c.commission?[`• Comisión: *${money(c.commission)}*`]:[]),
      '',
      `✅ *TOTAL A PAGAR: ${money(c.total)}*`,
      '',
      isCod?'📌 El cliente paga el total al recibir el paquete.':'📌 Envío normal por depósito / Tigo Money.',
      '📲 WhatsApp +504 3151-7755'
    ].filter(Boolean).join('\n');
  }
  async function downloadShortReceiptImage(doc,label='actual'){
    if(!doc || !(doc.items||[]).length) return toast('Agrega productos primero.');
    const host=document.createElement('div');
    host.className='shortReceiptExportHost';
    host.innerHTML=`<style>${shortReceiptExportCSS()}</style>${shortReceiptCardHTML(doc)}`;
    document.body.appendChild(host);
    try{
      await waitForImages(host);
      const node=host.querySelector('.short-receipt');
      const blob=await captureNodeAsPngBlob(node,isMobileDevice()?2.65:3);
      if(!blob) throw new Error('No se pudo generar el recibo.');
      downloadBlob(blob,`recibo-corto-${label}-${clientLabel(doc)}-${fileStamp()}-${slugFile(doc.id||'sdc')}.png`);
      toast(label.includes('pagar')?'Recibo corto al recibir descargado.':'Recibo corto normal descargado.');
    }catch(err){
      console.error(err);
      toast('No se pudo descargar el recibo corto. Revisa si cargó html2canvas.');
    }finally{
      host.remove();
    }
  }
  function openShortReceipt(isSale){
    const doc=currentDoc(isSale);
    const normalDoc=shortReceiptVariant(doc,'Normal');
    const codDoc=shortReceiptVariant(doc,'COD');
    openModal(`<div class="modal-head short-receipt-head"><h3>Factura corta comercial</h3><button class="close">×</button></div><div class="modal-body short-receipt-screen short-receipt-screen-v72 short-receipt-screen-v147"><div class="short-receipt-tip-v156">Elige la opción ideal para compartir por WhatsApp. El cliente verá claramente cuánto pagará según el tipo de entrega.</div><div class="short-receipt-grid-v147"><section class="short-receipt-variant-v147 short-receipt-variant-v157 short-receipt-variant-v158"><div class="short-receipt-preview-wrap">${shortReceiptCardHTML(normalDoc)}</div><button class="btn secondary full" id="downloadShortNormal">Descargar para WhatsApp · Envío normal</button></section><section class="short-receipt-variant-v147 short-receipt-variant-v157 short-receipt-variant-v158"><div class="short-receipt-preview-wrap">${shortReceiptCardHTML(codDoc)}</div><button class="btn full" id="downloadShortCOD">Descargar para WhatsApp · Pagar al recibir</button></section></div><div class="modal-actions short-receipt-actions" style="position:static"><button class="btn secondary" id="backFromShortReceipt">← Atrás</button><button class="btn secondary" id="copyShortReceipt">Copiar texto</button></div></div>`,true);
    $('#backFromShortReceipt')&&($('#backFromShortReceipt').onclick=()=>{openModal(quoteModalHTML(isSale),true); bindQuoteCommon(isSale); toast('Volviste a la cotización sin borrar los datos.');});
    $('#downloadShortNormal')&&($('#downloadShortNormal').onclick=()=>downloadShortReceiptImage(normalDoc,'recibo-1-envio-normal'));
    $('#downloadShortCOD')&&($('#downloadShortCOD').onclick=()=>downloadShortReceiptImage(codDoc,'recibo-2-pagar-al-recibir'));
    $('#copyShortReceipt').onclick=()=>{
      navigator.clipboard?.writeText(shortReceiptText(normalDoc)+'\n\n━━━━━━━━━━━━━━━━━━━━\n\n'+shortReceiptText(codDoc)); toast('Recibos cortos copiados.');
    };
  }
  function csvBlobDownload(filename,content){const blob=new Blob([content],{type:'text/csv;charset=utf-8'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=filename; a.click(); setTimeout(()=>URL.revokeObjectURL(a.href),1000);}
  function exportAllCSV(){
    const lines=['tipo,id,fecha,cliente,telefono,estado,total,productos'];
    (state.sales||[]).forEach(s=>lines.push(['venta',s.id,s.date,s.client,s.phone,s.status||'',calc(s).total,(s.items||[]).map(i=>`${i.name}${selectedColorLabel(i)?` (${selectedColorLabel(i)})`:''} x${i.qty}`).join(' | ')].map(csvEscape).join(',')));
    (state.quotes||[]).forEach(q=>lines.push(['cotizacion',q.id,q.date,q.client,q.phone,q.status||'',calc(q).total,(q.items||[]).map(i=>`${i.name}${selectedColorLabel(i)?` (${selectedColorLabel(i)})`:''} x${i.qty}`).join(' | ')].map(csvEscape).join(',')));
    (state.clients||[]).forEach(c=>lines.push(['cliente',c.key,c.lastDate,c.name,c.phone,c.municipality,c.lastTotal,c.reference].map(csvEscape).join(',')));
    csvBlobDownload(`ventas-clientes-sdc-${fileStamp()}.csv`,lines.join('\n'));
  }

  function openAlertsV196(){
    const m=alertMetrics();
    const groups=[
      {key:'lowStock',title:'Bajo stock',count:m.low,copy:'Productos que conviene reponer pronto.',items:m.lowStockProducts,accent:'warn',label:p=>`Solo ${num(productStock(p))} unidades`},
      {key:'outStock',title:'Agotados',count:m.out,copy:'Productos con stock en cero.',items:m.outStockProducts,accent:'bad',label:p=>'Stock en cero'},
      {key:'noCost',title:'Sin costo',count:m.nocost,copy:'Falta costo para calcular ganancia real.',items:m.noCostProducts,accent:'info',label:p=>'Revisar costo'},
      {key:'lowProfit',title:'Ganancia baja',count:m.lowMargin,copy:'Utilidad menor a Lps. 10 por unidad.',items:m.lowProfitProducts,accent:'warn',label:p=>`Gana ${moneyPrivate((Number(p.price||0)-Number(p.cost||0)))}`},
      {key:'noImage',title:'Sin imagen',count:m.noImage,copy:'Productos sin foto subida.',items:m.noImageProducts,accent:'info',label:p=>'Agregar imagen'}
    ];
    const cards=groups.map(g=>`<button type="button" class="alerts-summary-card-v196 ${g.accent}" data-alert-filter-v196="${g.key}"><span>${escapeHtml(g.title)}</span><b>${num(g.count)}</b><small>${escapeHtml(g.copy)}</small></button>`).join('');
    const rows=groups.flatMap(g=>g.items.slice(0,24).map(p=>({group:g,p}))).slice(0,90).map(({group:g,p})=>`<div class="alert-row-v196 ${g.accent}"><div><b>${escapeHtml(p.name)}</b><span>${escapeHtml(g.title)} · ${escapeHtml(g.label(p))}</span></div><button class="btn small secondary" type="button" data-edit-alert-product-v196="${escapeHtml(p.id)}">Editar</button></div>`).join('') || '<div class="empty-state">No hay alertas pendientes.</div>';
    openModal(`<div class="modal-head alerts-head-v196"><div><small>Centro de revisión</small><h3>Alertas</h3></div><button class="close">×</button></div><div class="modal-body alerts-modal-v196"><div class="alerts-total-v196"><span>Total alertas</span><b>${num(m.total)}</b><small>${num(activeProducts().length)} productos revisados</small></div><div class="alerts-summary-grid-v196">${cards}</div><div class="alerts-list-v196">${rows}</div></div>`,true);
    $$('[data-alert-filter-v196]',modalRoot).forEach(btn=>btn.onclick=()=>{
      const special=btn.getAttribute('data-alert-filter-v196')||'';
      closeModal();
      filter.cat='Todos'; filter.q=''; filter.special=special;
      render();
      setTimeout(()=>{document.getElementById('inventario')?.scrollIntoView({behavior:'smooth',block:'start'}); toast(`Filtro aplicado: ${btn.querySelector('span')?.textContent||'Alertas'}.`);},80);
    });
    $$('[data-edit-alert-product-v196]',modalRoot).forEach(btn=>btn.onclick=()=>{const id=btn.getAttribute('data-edit-alert-product-v196'); closeModal(); openProductEditor(id);});
  }

  function openLowProfit(){
    const rows=alertMetrics().lowProfitProducts
      .sort((a,b)=>(Number(a.price||0)-Number(a.cost||0))-(Number(b.price||0)-Number(b.cost||0)))
      .map(p=>{
        const gain=Math.max(0,Number(p.price||0)-Number(p.cost||0));
        return `<div class="cart-row low-profit-row-v84"><div><b>${escapeHtml(p.name)}</b><br><span>${escapeHtml(p.id)} · Precio ${money(p.price)} · Costo ${money(p.cost)} · Gana ${money(gain)}</span></div><button class="btn small secondary" data-editprofit="${escapeHtml(p.id)}">Editar</button></div>`;
      }).join('') || '<div class="empty-state">No hay productos con ganancia baja. El capitalismo respira tranquilo por ahora.</div>';
    openModal(`<div class="modal-head"><h3>Ganancia baja</h3><button class="close">×</button></div><div class="modal-body"><div class="card-box low-profit-note-v84"><b>Revisa estos precios</b><span>Son productos con costo y precio registrados, pero con menos de Lps. 10 de utilidad por unidad.</span></div><div class="cart-list">${rows}</div></div>`,true);
    $$('[data-editprofit]',modalRoot).forEach(b=>b.onclick=()=>{closeModal();openProductEditor(b.dataset.editprofit)});
  }

  function openNoCost(){openModal(`<div class="modal-head"><h3>Productos sin costo</h3><button class="close">×</button></div><div class="modal-body"><div class="cart-list">${state.products.filter(p=>+p.cost<=0).map(p=>`<div class="cart-row"><div><b>${escapeHtml(p.name)}</b><br><span>${escapeHtml(p.id)}</span></div><button class="btn small secondary" data-editcost="${p.id}">Editar</button></div>`).join('')||'<div class="empty-state">Todo tiene costo registrado.</div>'}</div></div>`,true); $$('[data-editcost]',modalRoot).forEach(b=>b.onclick=()=>{closeModal();openProductEditor(b.dataset.editcost)})}

  // Compatibilidad final: cualquier parche antiguo que llame "Sheets" ahora usa Firebase.
  async function saveProductToSheets(product, previousId=''){return saveProductToFirebase(product, previousId)}
  async function archiveProductInSheets(productId){return archiveProductInFirebase(productId)}
  async function updateProductStockInSheets(productId, stock){
    const p=productById(productId);
    if(!p) return false;
    return syncStockAfterSale([productId]);
  }
  async function saveDocumentToSheets(doc, kind){return saveDocumentToFirebase(doc, kind)}
  async function syncStockAfterSale(ids){
    await waitForFirebase().catch(()=>null);
    if(typeof window.actualizarStockFirebase!=='function') return false;
    const list=Array.from(ids||[]).map(id=>productById(id)).filter(Boolean);
    for(const p of list){
      await window.actualizarStockFirebase(p.id, productToFirebasePayload(p));
    }
    if(list.length){
      state.settings.lastFirebaseSync=new Date().toISOString();
      save();
    }
    return !!list.length;
  }


  // SDC V196: API segura para que el menú premium abra funciones reales del panel.
  window.SDCAppV196 = {
    setPage:setPageV150,
    render,
    openSale,
    openQuote,
    openProfit,
    openReceipts,
    openNotifications,
    openAlertsV196,
    openProductEditor,
    openSavedQuotes,
    openCategoriesSheet,
    applyCategory,
    toast
  };
  window.SDCApp = window.SDCAppV196;

  // SDC v287: controles delegados robustos para móvil/PC.
  // Evita que botones Comayagua/Honduras, + y - fallen si el render cambia o hay capas encima.
  (function(){
    if(window.__sdcV287Controls) return;
    window.__sdcV287Controls = true;

    document.addEventListener('click', function(ev){
      const route = ev.target && ev.target.closest && ev.target.closest('[data-route-id][data-route-mode]');
      if(route){
        ev.preventDefault();
        ev.stopPropagation();
        const id = route.getAttribute('data-route-id');
        const mode = route.getAttribute('data-route-mode') === 'local' ? 'local' : 'hn';
        setProductDeliveryMode(id, mode);
        return false;
      }

      const minus = ev.target && ev.target.closest && ev.target.closest('[data-cqty-minus]');
      if(minus){
        ev.preventDefault();
        ev.stopPropagation();
        const id = minus.getAttribute('data-cqty-minus');
        setClientQty(id, clientQty(id)-1);
        return false;
      }

      const plus = ev.target && ev.target.closest && ev.target.closest('[data-cqty-plus]');
      if(plus){
        ev.preventDefault();
        ev.stopPropagation();
        const id = plus.getAttribute('data-cqty-plus');
        setClientQty(id, clientQty(id)+1);
        return false;
      }

      const detailRoute = ev.target && ev.target.closest && ev.target.closest('[data-v49-route]');
      if(detailRoute){
        ev.preventDefault();
        ev.stopPropagation();
        if(typeof window.sdcDetailSetRoute === 'function'){
          window.sdcDetailSetRoute(ev, detailRoute.getAttribute('data-v49-route'));
        }
        return false;
      }

      const detailMinus = ev.target && ev.target.closest && ev.target.closest('#v49QtyMinus');
      if(detailMinus){
        ev.preventDefault();
        ev.stopPropagation();
        if(typeof window.sdcDetailQty === 'function') window.sdcDetailQty(ev,-1);
        return false;
      }

      const detailPlus = ev.target && ev.target.closest && ev.target.closest('#v49QtyPlus');
      if(detailPlus){
        ev.preventDefault();
        ev.stopPropagation();
        if(typeof window.sdcDetailQty === 'function') window.sdcDetailQty(ev,1);
        return false;
      }
    }, true);

    document.addEventListener('input', function(ev){
      const inp = ev.target && ev.target.matches && ev.target.matches('[data-cqty-input]') ? ev.target : null;
      if(!inp) return;
      setClientQty(inp.getAttribute('data-cqty-input'), inp.value);
    }, true);

    window.SDCAppV287 = Object.assign({}, window.SDCApp || {}, {
      setProductDeliveryMode,
      setClientQty,
      productDeliveryMode,
      clientQty,
      updateClientCardTotals
    });
    window.SDCApp = window.SDCAppV287;
  })();


  window.addEventListener('storage',e=>{if(e.key===SDCStore.KEY){state=SDCStore.load(); state.products=dedupeProducts((state.products||[]).filter(isRealProduct)); hydrateState(); render(); toast('Datos actualizados.')}});
  $('#goTop').onclick=()=>window.scrollTo({top:0,behavior:'smooth'});
  window.addEventListener('scroll',()=>{
    const goTop = $('#goTop');
    if(!goTop) return;
    if(document.body.classList.contains('sdc-login-mode')){goTop.style.display='none';return;}
    goTop.style.display=scrollY>320?'block':'none';
  });
  // Exponer funciones para sincronización Firebase y compatibilidad con parches anteriores.
  window.saveProductToFirebase = saveProductToFirebase;
  window.saveProductToSheets = saveProductToFirebase;
  window.syncProductsFromFirebase = syncProductsFromFirebase;
  window.syncProductsFromSheets = syncProductsFromFirebase;
  window.uploadLocalProductsToFirebase = uploadLocalProductsToFirebase;
  window.uploadLocalProductsToSheets = uploadLocalProductsToFirebase;
  window.getSheetApiUrl = getSheetApiUrl;
  window.getSheetId = getSheetId;
  applyAppearance();
  render();
  bootFirebaseSync();
  requestAnimationFrame(function(){ try{ window.scrollTo({top:0,left:0,behavior:'auto'}); }catch(e){ window.scrollTo(0,0); } });
  setTimeout(function(){ try{ window.scrollTo({top:0,left:0,behavior:'auto'}); }catch(e){} }, 250);
})();

;/* ==== js/sdc-v190-mobile-polish.js ==== */

/* SD Comayagua v190 · Mobile polish layer
   No toca Firebase ni datos. Solo mejora lectura, clases y microinteracciones. */
(function(){
  'use strict';
  const root=document.documentElement;
  const body=document.body;
  const reduceMotion=window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function isMobileWidth(){return window.matchMedia ? window.matchMedia('(max-width: 640px)').matches : window.innerWidth<=640;}
  function markReady(){
    body.classList.add('sdc-v190-ready');
    body.classList.toggle('sdc-v190-phone',isMobileWidth());
    root.dataset.sdcV190='ready';
  }
  function annotateCards(){
    document.querySelectorAll('.product-card-v190').forEach(card=>{
      const title=(card.querySelector('h3')?.textContent || '').trim();
      card.dataset.longTitle=title.length>42?'1':'0';
      const stock=Number(card.dataset.productStock||'0');
      card.dataset.stockLevel=stock<=0?'out':stock<=3?'low':'ok';
    });
  }
  function compactStickyOnScroll(){
    const y=window.scrollY || 0;
    body.classList.toggle('sdc-v190-scrolled',y>36);
    body.classList.toggle('sdc-v190-deep-scroll',y>260);
  }
  function addTapFeedback(){
    if(reduceMotion) return;
    document.addEventListener('pointerdown',ev=>{
      const btn=ev.target.closest('button,[role="button"],.product-card-v190');
      if(!btn || btn.dataset.sdcTap==='1') return;
      btn.dataset.sdcTap='1';
      window.setTimeout(()=>{delete btn.dataset.sdcTap;},160);
    },{passive:true});
  }
  function improveSearchKeyboard(){
    document.querySelectorAll('#inventorySearchInput,#searchInput').forEach(input=>{
      if(input.dataset.sdcV190Search==='1') return;
      input.dataset.sdcV190Search='1';
      input.setAttribute('enterkeyhint','search');
      input.setAttribute('spellcheck','false');
      input.setAttribute('autocomplete','off');
    });
  }
  function enhance(){
    markReady();
    annotateCards();
    improveSearchKeyboard();
    compactStickyOnScroll();
  }
  const mo=new MutationObserver(()=>{
    if(window.__sdcV190Raf) return;
    window.__sdcV190Raf=requestAnimationFrame(()=>{
      window.__sdcV190Raf=0;
      enhance();
    });
  });
  function boot(){
    enhance();
    addTapFeedback();
    mo.observe(document.getElementById('app') || document.body,{childList:true,subtree:true});
    window.addEventListener('scroll',compactStickyOnScroll,{passive:true});
    window.addEventListener('resize',enhance,{passive:true});
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();


;/* ==== js/sdc-v190-safe-mobile.js ==== */

/* SD Comayagua v190 · Seguridad visual móvil
   Evita zoom accidental, corrige saltos y mejora enfoque en formularios. */
(function(){
  'use strict';
  let lastTouchEnd=0;
  document.addEventListener('touchend',function(ev){
    const now=Date.now();
    if(now-lastTouchEnd<=280 && !ev.target.closest('input,textarea,select')) ev.preventDefault();
    lastTouchEnd=now;
  },{passive:false});

  function scrollFocusedIntoView(ev){
    const el=ev.target;
    if(!el || !el.matches || !el.matches('input,textarea,select')) return;
    window.setTimeout(()=>{
      try{el.scrollIntoView({block:'center',behavior:'smooth'});}catch(err){}
    },260);
  }
  document.addEventListener('focusin',scrollFocusedIntoView);
})();


;/* ==== js/sdc-v191-category-ux.js ==== */

/* SD Comayagua v191 · UX de categorías
   Mantiene visible la categoría activa y agrega polish sin tocar Firebase. */
(function(){
  'use strict';
  function qs(sel,root){return (root||document).querySelector(sel)}
  function qsa(sel,root){return Array.from((root||document).querySelectorAll(sel))}
  function centerActiveCategory(){
    const active=qs('.category-strip-v191 .category-chip-v191.active');
    if(!active) return;
    try{active.scrollIntoView({block:'nearest',inline:'center',behavior:'smooth'});}catch(err){}
  }
  function markLongCategoryNames(){
    qsa('.category-chip-v191 span,.category-sheet-card-v191 span').forEach(el=>{
      const txt=(el.textContent||'').trim();
      if(txt.length>14) el.dataset.long='1';
      else delete el.dataset.long;
    });
  }
  function focusCategoriesOnce(){
    let shouldFocus=false;
    try{
      shouldFocus=location.hash==='#categorias' || sessionStorage.getItem('sdc_v191_focus_categories')==='1';
      sessionStorage.removeItem('sdc_v191_focus_categories');
    }catch(err){ shouldFocus=location.hash==='#categorias'; }
    if(!shouldFocus || document.body.dataset.sdc191Focused==='1') return;
    const rail=qs('.category-rail-v191');
    if(!rail) return;
    document.body.dataset.sdc191Focused='1';
    window.setTimeout(function(){
      try{rail.scrollIntoView({block:'center',behavior:'smooth'});}catch(err){}
    },360);
  }
  function enhance(){
    document.body.classList.add('sdc-v191-categorias');
    markLongCategoryNames();
    centerActiveCategory();
    focusCategoriesOnce();
  }
  let raf=0;
  const schedule=function(){
    if(raf) return;
    raf=requestAnimationFrame(function(){raf=0;enhance();});
  };
  const mo=new MutationObserver(schedule);
  function boot(){
    enhance();
    const app=document.getElementById('app') || document.body;
    mo.observe(app,{childList:true,subtree:true});
    window.addEventListener('resize',schedule,{passive:true});
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();


;/* ==== js/sdc-v192-scroll-rescue.js ==== */

/* SD Comayagua v192 · Scroll Rescue
   Desbloquea la página si algún modal/menú viejo deja overflow hidden. */
(function(){
  'use strict';
  const doc=document.documentElement;
  const body=document.body;
  let raf=0;

  function visible(el){
    if(!el) return false;
    const st=getComputedStyle(el);
    return st.display!=='none' && st.visibility!=='hidden' && Number(st.opacity||1)!==0;
  }

  function hasOpenModal(){
    return Array.from(document.querySelectorAll('.modal-backdrop,.sdc-menu-backdrop-v116')).some(visible);
  }

  function clearInlineLock(el){
    if(!el || !el.style) return;
    const props=['overflow','overflowY','height','maxHeight','position','top','left','right','bottom','width'];
    props.forEach(p=>{
      const v=el.style[p] || '';
      if(!v) return;
      if(p==='overflow' || p==='overflowY'){
        if(/hidden|clip/i.test(v)) el.style[p]='';
      }else if(p==='position'){
        if(/fixed/i.test(v)) el.style[p]='';
      }else if(p==='height' || p==='maxHeight'){
        if(/100vh|100dvh|0px/i.test(v)) el.style[p]='';
      }else if(/^-?\d+px$/.test(v) || /auto/i.test(v)){
        el.style[p]='';
      }
    });
  }

  function unlockScroll(){
    if(!body) return;
    const lockedByRealModal=hasOpenModal();
    if(!lockedByRealModal){
      doc.classList.remove('modal-open-root');
      body.classList.remove('modal-open');
      body.classList.add('sdc-v192-scroll-ready');
      clearInlineLock(doc);
      clearInlineLock(body);
      doc.style.overflowY='auto';
      body.style.overflowY='auto';
      doc.style.height='auto';
      body.style.height='auto';
      body.style.position='static';
    }
    document.querySelectorAll('#app,.app,#inventario,.inventory-content,.products-screen-v190').forEach(el=>{
      if(!lockedByRealModal){
        el.style.maxHeight='';
        el.style.height='';
        if(/hidden|clip/i.test(el.style.overflow||'')) el.style.overflow='';
      }
    });
  }

  function schedule(){
    if(raf) return;
    raf=requestAnimationFrame(function(){raf=0; unlockScroll();});
  }

  function makeScrollFeelAlive(){
    // En iOS/Android, al tocar tarjetas o chips, aseguramos que el documento esté desbloqueado.
    document.addEventListener('touchstart',schedule,{passive:true,capture:true});
    document.addEventListener('pointerdown',schedule,{passive:true,capture:true});
    document.addEventListener('wheel',schedule,{passive:true,capture:true});
    document.addEventListener('click',function(){setTimeout(unlockScroll,80);},{passive:true,capture:true});
  }

  function boot(){
    unlockScroll();
    makeScrollFeelAlive();
    new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class','style']});
    window.addEventListener('pageshow',unlockScroll,{passive:true});
    window.addEventListener('resize',schedule,{passive:true});
    window.addEventListener('orientationchange',function(){setTimeout(unlockScroll,250);},{passive:true});
    setTimeout(unlockScroll,250);
    setTimeout(unlockScroll,900);
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();


;/* ==== js/sdc-v193-scroll-final.js ==== */

/* SD Comayagua v193 · Scroll Final
   Repara scroll vertical y agrega arrastre horizontal real en categorías/chips. */
(function(){
  'use strict';
  const doc=document.documentElement;
  const body=document.body;
  const H_SCROLL_SELECTORS=[
    '.category-strip-v191',
    '.quote-category-strip',
    '.quick-scroll-v83',
    '.alert-scroll-v83',
    '.chips',
    '.panel-table-wrap-v150'
  ].join(',');
  let raf=0;

  function isVisible(el){
    if(!el || !el.isConnected) return false;
    const st=getComputedStyle(el);
    if(st.display==='none' || st.visibility==='hidden' || Number(st.opacity||1)===0) return false;
    const r=el.getBoundingClientRect();
    return r.width>0 && r.height>0;
  }
  function hasOpenModal(){
    return Array.from(document.querySelectorAll('.modal-backdrop')).some(isVisible);
  }
  function hasOpenMenu(){
    return document.body.classList.contains('sdc-menu-open-v116') && Array.from(document.querySelectorAll('.sdc-menu-backdrop-v116,.sdc-menu-drawer-v116')).some(isVisible);
  }
  function setImp(el,prop,value){
    try{ el.style.setProperty(prop,value,'important'); }catch(err){}
  }
  function clearBadInline(el){
    if(!el || !el.style) return;
    ['overflow','overflow-y','height','max-height','position','top','left','right','bottom'].forEach(prop=>{
      const v=el.style.getPropertyValue(prop) || '';
      if(!v) return;
      if(prop.includes('overflow') && /hidden|clip/i.test(v)) el.style.removeProperty(prop);
      if((prop==='height'||prop==='max-height') && /100vh|100dvh|0px/i.test(v)) el.style.removeProperty(prop);
      if(prop==='position' && /fixed/i.test(v)) el.style.removeProperty(prop);
      if(['top','left','right','bottom'].includes(prop) && /^-?\d+(\.\d+)?px$/i.test(v)) el.style.removeProperty(prop);
    });
  }
  function unlockPageScroll(){
    const locked=hasOpenModal() || hasOpenMenu();
    body.classList.add('sdc-v193-scroll-final');
    if(locked) return;

    doc.classList.remove('modal-open-root');
    body.classList.remove('modal-open');
    clearBadInline(doc);
    clearBadInline(body);

    setImp(doc,'height','auto');
    setImp(doc,'min-height','100%');
    setImp(doc,'max-height','none');
    setImp(doc,'overflow-y','scroll');
    setImp(doc,'overflow-x','hidden');
    setImp(doc,'touch-action','pan-x pan-y pinch-zoom');

    setImp(body,'position','static');
    setImp(body,'height','auto');
    setImp(body,'min-height','100%');
    setImp(body,'max-height','none');
    setImp(body,'overflow-y','auto');
    setImp(body,'overflow-x','hidden');
    setImp(body,'touch-action','pan-x pan-y pinch-zoom');

    document.querySelectorAll('#app,.app,#inventario,.products-screen-v178,.products-screen-v189,.products-screen-v190,.inventory-content,.grid').forEach(el=>{
      clearBadInline(el);
      setImp(el,'height','auto');
      setImp(el,'max-height','none');
      setImp(el,'overflow','visible');
      setImp(el,'touch-action','pan-x pan-y pinch-zoom');
    });
  }
  function scheduleUnlock(){
    if(raf) return;
    raf=requestAnimationFrame(()=>{raf=0; unlockPageScroll(); enhanceHorizontalScrollers();});
  }

  function canScrollHorizontally(el){
    return el && el.scrollWidth > el.clientWidth + 2;
  }
  function enhanceOneScroller(el){
    if(!el || el.dataset.sdcV193Hscroll==='1') return;
    el.dataset.sdcV193Hscroll='1';
    let startX=0,startY=0,startLeft=0,dragging=false,moved=false,pid=null;

    el.addEventListener('pointerdown',ev=>{
      if(ev.button && ev.button!==0) return;
      if(!canScrollHorizontally(el)) return;
      dragging=true; moved=false; pid=ev.pointerId;
      startX=ev.clientX; startY=ev.clientY; startLeft=el.scrollLeft;
      try{el.setPointerCapture(pid);}catch(err){}
      el.classList.add('is-drag-ready');
    },{passive:true});

    el.addEventListener('pointermove',ev=>{
      if(!dragging) return;
      const dx=ev.clientX-startX;
      const dy=ev.clientY-startY;
      if(Math.abs(dx)>7 && Math.abs(dx)>Math.abs(dy)*1.08){
        moved=true;
        el.classList.add('is-dragging');
        el.scrollLeft=startLeft-dx;
        ev.preventDefault();
      }
    },{passive:false});

    function endDrag(){
      if(!dragging) return;
      dragging=false;
      el.classList.remove('is-drag-ready','is-dragging');
      if(moved){
        el.dataset.sdcV193Moved='1';
        setTimeout(()=>{delete el.dataset.sdcV193Moved;},180);
      }
      try{ if(pid!==null) el.releasePointerCapture(pid); }catch(err){}
      pid=null;
    }
    el.addEventListener('pointerup',endDrag,{passive:true});
    el.addEventListener('pointercancel',endDrag,{passive:true});
    el.addEventListener('lostpointercapture',endDrag,{passive:true});
    el.addEventListener('click',ev=>{
      if(el.dataset.sdcV193Moved==='1'){
        ev.preventDefault();
        ev.stopPropagation();
      }
    },true);

    // Rueda de mouse/trackpad: si mueve de lado, desplaza la tira horizontal.
    el.addEventListener('wheel',ev=>{
      if(!canScrollHorizontally(el)) return;
      const delta=Math.abs(ev.deltaX)>Math.abs(ev.deltaY) ? ev.deltaX : (ev.shiftKey ? ev.deltaY : 0);
      if(delta){
        el.scrollLeft += delta;
        ev.preventDefault();
      }
    },{passive:false});
  }
  function enhanceHorizontalScrollers(){
    document.querySelectorAll(H_SCROLL_SELECTORS).forEach(enhanceOneScroller);
  }

  function boot(){
    unlockPageScroll();
    enhanceHorizontalScrollers();
    ['touchstart','pointerdown','wheel','scroll','resize'].forEach(type=>{
      window.addEventListener(type,scheduleUnlock,{passive:true,capture:true});
    });
    document.addEventListener('click',()=>setTimeout(scheduleUnlock,50),{passive:true,capture:true});
    new MutationObserver(scheduleUnlock).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class','style']});
    setTimeout(scheduleUnlock,250);
    setTimeout(scheduleUnlock,900);
    setTimeout(scheduleUnlock,1800);
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();


;/* ==== js/sdc-v194-category-image-polish.js ==== */

/* SD Comayagua v194 · Marca visual para imágenes automáticas por categoría. */
(function(){
  'use strict';
  function isCategoryFallback(src){
    const s=String(src||'');
    return s.indexOf('data:image/svg+xml')===0 || s.indexOf('/assets/categorias/')>-1 || s.indexOf('assets/categorias/')>-1;
  }
  function mark(){
    document.querySelectorAll('img').forEach(function(img){
      const src=img.currentSrc || img.getAttribute('src') || '';
      const fallback=isCategoryFallback(src);
      img.classList.toggle('has-category-fallback-v194', fallback);
      const photo=img.closest && img.closest('.product-photo-v178');
      if(photo) photo.classList.toggle('has-category-fallback-v194', fallback);
    });
  }
  var raf=0;
  function schedule(){
    if(raf) return;
    raf=requestAnimationFrame(function(){raf=0;mark();});
  }
  function boot(){
    document.body.classList.add('sdc-v194-category-images');
    mark();
    var app=document.getElementById('app') || document.body;
    new MutationObserver(schedule).observe(app,{childList:true,subtree:true,attributes:true,attributeFilter:['src','class']});
    window.addEventListener('load',mark,{once:false,passive:true});
    window.addEventListener('resize',schedule,{passive:true});
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();


;/* ==== js/sdc-v195-no-blue-categorias.js ==== */

/* SD Comayagua v195 · Limpieza final de barra azul y chips horizontales. */
(function(){
  const qs=(s,r=document)=>r.querySelector(s);
  const qsa=(s,r=document)=>Array.from(r.querySelectorAll(s));
  function clean(){
    document.body && document.body.classList.add('sdc-v195-no-blue-categorias');
    qsa('.category-strip-v191').forEach(el=>{ el.remove(); });
    qsa('.category-chip-v191').forEach(el=>{ el.remove(); });
    qsa('.catalog-metrics-v189').forEach(el=>{
      // Si quedó HTML viejo en caché, lo ocultamos para que no reaparezca la franja azul.
      el.setAttribute('aria-hidden','true');
      el.classList.add('sdc-v195-hidden-old-metrics');
    });
    const mini=qs('.catalog-mini-summary-v195');
    if(mini){
      mini.style.removeProperty('height');
      mini.style.removeProperty('overflow');
    }
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',clean,{once:true});
  else clean();
  const mo=new MutationObserver(()=>clean());
  try{ mo.observe(document.documentElement,{childList:true,subtree:true}); }catch(err){}
})();


;/* ==== js/sdc-v196-final-polish.js ==== */

/* SDC V196 · acciones de menú y estructura final */
(function(){
  'use strict';
  const STORE_KEY='sdc_control_ventas_v90';
  const $=(sel,root=document)=>root.querySelector(sel);
  const $$=(sel,root=document)=>Array.from(root.querySelectorAll(sel));
  function toast(msg){
    const el=document.getElementById('toast');
    if(el){ el.textContent=msg; el.classList.add('show'); clearTimeout(el._sdc196); el._sdc196=setTimeout(()=>el.classList.remove('show'),2200); }
  }
  function closeMenu(){ document.body.classList.remove('sdc-menu-open-v116'); }
  function closeMenuPanels(){ $$('.sdc-menu-modal-v116').forEach(x=>x.remove()); }
  function goPage(page){
    closeMenu(); closeMenuPanels();
    if(window.SDCSetPageV150){ window.SDCSetPageV150(page); return true; }
    const map={inicio:'tabInicio',panel:'tabPanel',productos:'tabProductos'};
    const btn=document.querySelector(`[data-action="${map[page]||map.inicio}"]`);
    if(btn){ btn.click(); return true; }
    try{ localStorage.setItem('sdc_v150_page',page); }catch(e){}
    return false;
  }
  function appCall(name,...args){
    const api=window.SDCAppV196||window.SDCApp;
    if(api && typeof api[name]==='function'){ api[name](...args); return true; }
    return false;
  }
  function clickAction(action){
    const btn=document.querySelector(`[data-action="${action}"]`);
    if(btn){ btn.click(); return true; }
    return false;
  }
  function menuAction(action){
    if(!action) return false;
    if(action==='open' || action==='close') return false;
    closeMenu(); closeMenuPanels();
    switch(action){
      case 'inicio': return goPage('inicio');
      case 'productos': return goPage('productos');
      case 'nuevo':
      case 'inventario':
        if(appCall('openProductEditor')) return true;
        goPage('productos'); setTimeout(()=>clickAction('newProduct')||toast('Toca + Producto para agregar inventario.'),220); return true;
      case 'vender':
        if(appCall('openSale')) return true;
        if(clickAction('sell')) return true;
        toast('No se pudo abrir Vender todavía. Recarga la página e intenta de nuevo.'); return true;
      case 'cotizar':
        if(appCall('openQuote')) return true;
        if(clickAction('quote')) return true;
        toast('No se pudo abrir Cotizar todavía. Recarga la página e intenta de nuevo.'); return true;
      case 'ganancias':
        if(appCall('openProfit')) return true;
        if(clickAction('profit')) return true;
        return false;
      case 'recibos':
        if(appCall('openReceipts')) return true;
        if(clickAction('receipts')) return true;
        return false;
      case 'alertas':
        if(appCall('openAlertsV196')) return true;
        if(appCall('openNotifications')) return true;
        if(clickAction('notifications')) return true;
        return false;
      case 'cotizaciones':
        if(appCall('openSavedQuotes')) return true;
        if(clickAction('quotes')) return true;
        return false;
      default: return false;
    }
  }
  document.addEventListener('click',function(ev){
    const node=ev.target.closest && ev.target.closest('[data-sdc127]');
    if(!node) return;
    const action=node.getAttribute('data-sdc127');
    if(action==='open' || action==='close') return;
    const handled=menuAction(action);
    if(handled){ ev.preventDefault(); ev.stopPropagation(); ev.stopImmediatePropagation(); }
  },true);
  function polishAfterRender(){
    document.documentElement.style.overflowY='auto';
    document.body.style.overflowY='auto';
    document.body.style.overflowX='hidden';
    $$('.stats .stat b,.panel-stats-v150 article b').forEach(b=>{
      const txt=(b.textContent||'').trim();
      if(/^Lps\.\s*/i.test(txt)) b.classList.add('sdc196-money-fit');
    });
    $$('.sdc-menu-modal-v116').forEach(m=>m.setAttribute('data-sdc196','polished'));
  }
  const mo=new MutationObserver(()=>polishAfterRender());
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',()=>{polishAfterRender(); mo.observe(document.body,{childList:true,subtree:true});});
  else {polishAfterRender(); mo.observe(document.body,{childList:true,subtree:true});}
})();


;/* ==== js/sdc-boot-check.js ==== */

/* SDC Boot Check: evita pantalla vacía y muestra qué archivo falta si algo no carga. */
(function(){
  'use strict';
  function showProblem(){
    const app = document.getElementById('app');
    if(!app || app.innerHTML.trim()) return;

    const missing = [];
    if(!window.SDC_CONFIG) missing.push('js/data.js');
    if(!window.SDCStore) missing.push('js/storage.js');

    app.innerHTML = `
      <section style="max-width:620px;margin:36px auto;padding:18px;border-radius:24px;background:#071827;color:#f4fbff;border:1px solid rgba(37,223,255,.35);font-family:Arial,sans-serif;box-shadow:0 18px 45px rgba(0,0,0,.35)">
        <h1 style="margin:0 0 8px;font-size:24px;letter-spacing:.04em">SDC no cargó completo</h1>
        <p style="margin:0 0 12px;color:#bdd6e7;line-height:1.4">La página quedó vacía porque faltan archivos o no se subieron en la carpeta correcta.</p>
        <div style="background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.10);border-radius:18px;padding:12px;margin:12px 0">
          <b>Revisa que existan exactamente:</b>
          <ul style="margin:8px 0 0;padding-left:20px;line-height:1.7">
            <li>css/styles.css</li>
            <li>js/data.js</li>
            <li>js/storage.js</li>
            <li>js/app.js</li>
            <li>assets/logo-sdc-2026.png</li>
          </ul>
        </div>
        <p style="margin:10px 0 0;color:#8fb1c7;font-size:13px">${missing.length ? 'Detectado como faltante: ' + missing.join(', ') : 'Si los archivos están, vuelve a subir el paquete completo y limpia caché.'}</p>
      </section>`;
  }
  window.addEventListener('load', function(){ setTimeout(showProblem, 1200); });
})();


;/* ==== js/sdc-v97-page-split.js ==== */

/* SDC V151: puente sin duplicar barras antiguas. */
(function(){
  'use strict';
  const VALID=new Set(['inicio','panel','productos']);
  function clean(page){ return VALID.has(page)?page:(page==='catalog'?'inicio':'inicio'); }
  function setPage(page, opts={}){
    const target=clean(page);
    try{
      localStorage.setItem('sdc_v150_page',target);
      localStorage.setItem('sdc_v97_page',target==='panel'?'inicio':target);
    }catch(e){}
    if(typeof window.SDCSetPageV150==='function'){
      window.SDCSetPageV150(target);
    }else{
      document.body.dataset.sdcPageV150=target;
    }
    if(target==='productos' && opts.focusSearch){
      setTimeout(()=>{
        const search=document.querySelector('#inventorySearchInput') || document.querySelector('#searchInput');
        search?.scrollIntoView({behavior:'smooth',block:'center'});
        setTimeout(()=>search?.focus({preventScroll:true}),180);
      },120);
    }
  }
  document.addEventListener('click',ev=>{
    const pageBtn=ev.target.closest('[data-sdc-page-target]');
    if(pageBtn){ ev.preventDefault(); ev.stopImmediatePropagation(); setPage(pageBtn.dataset.sdcPageTarget); return; }
    const btn=ev.target.closest('[data-action]');
    if(!btn) return;
    if(btn.dataset.action==='catalog'){ ev.preventDefault(); ev.stopImmediatePropagation(); setPage('inicio'); }
    if(btn.dataset.action==='focusSearch'){ ev.preventDefault(); ev.stopImmediatePropagation(); setPage('productos',{focusSearch:true}); }
  },true);
  window.SDCSetPageV97=setPage;
})();


;/* ==== js/sdc-v103-hard-refresh.js ==== */

/* SDC V147: MENU y ACTUALIZAR FIREBASE arriba del encabezado. */
(function(){
  'use strict';
  const VERSION='108-refresh-top-tools';
  const STAMP='sdc_refresh_stamp';

  function toast(msg){
    const el=document.getElementById('toast');
    if(el){
      el.textContent=msg;
      el.classList.add('show');
      clearTimeout(el._sdcRefreshTimer);
      el._sdcRefreshTimer=setTimeout(()=>el.classList.remove('show'),2400);
    }else{
      console.log(msg);
    }
  }

  function utilityHTML(){
    return `<nav class="sdc-utility-tabs-v105 sdc-top-tools-v108 sdc-top-tools-v147 no-print" data-sdc-utility-tabs="1" aria-label="Acciones del sistema">
      <button type="button" class="sdc-sync-tab-v105 sdc-menu-tab-v147" data-sdc127="open" title="Abrir menú">
        <i>☰</i><span>Menú</span>
      </button>
      <button type="button" class="sdc-refresh-tab-v105 sdc-refresh-tab-v147" data-action="sync" data-sdc-utility-sync="1" title="Actualizar Firebase" aria-label="Actualizar Firebase">
        <i class="sdc-refresh-icon-v103">↻</i><span class="sdc-refresh-text-v103">Actualizar Firebase</span>
      </button>
    </nav>`;
  }

  function cleanOldButtons(){
    document.querySelectorAll('.topbar [data-sdc-hard-refresh], .topbar-v87 [data-sdc-hard-refresh], [data-sdc-page-tabs] [data-sdc-hard-refresh]').forEach(btn=>btn.remove());
    document.querySelectorAll('[data-sdc-utility-tabs]').forEach((row,idx)=>{ if(idx>0) row.remove(); });
  }

  function ensureButton(){
    cleanOldButtons();
    const top=document.querySelector('.topbar,.topbar-v87');
    if(!top) return;
    let row=document.querySelector('[data-sdc-utility-tabs]');
    if(!row){
      top.insertAdjacentHTML('beforebegin',utilityHTML());
    }else if(row.nextElementSibling!==top){
      top.parentNode.insertBefore(row, top);
      row.classList.add('sdc-top-tools-v108');
    }
  }

  async function clearBrowserCaches(){
    const jobs=[];
    try{
      if('caches' in window){
        const names=await caches.keys();
        jobs.push(...names.map(name=>caches.delete(name)));
      }
    }catch(err){ console.warn('No se pudo limpiar CacheStorage',err); }
    try{
      if('serviceWorker' in navigator){
        const regs=await navigator.serviceWorker.getRegistrations();
        jobs.push(...regs.map(reg=>reg.unregister()));
      }
    }catch(err){ console.warn('No se pudo quitar service worker',err); }
    await Promise.allSettled(jobs);
  }

  function cleanLocalRuntimeCache(){
    try{
      const keepExact=new Set(['sdc_v83_theme','sdc_v97_page','sdc_inventory_layout','sdc_card_view']);
      Object.keys(localStorage).forEach(key=>{
        if(keepExact.has(key)) return;
        if(/cache|version|stamp|boot|assets|build|refresh/i.test(key)) localStorage.removeItem(key);
      });
      Object.keys(sessionStorage).forEach(key=>sessionStorage.removeItem(key));
      localStorage.setItem(STAMP,VERSION+'-'+Date.now());
      localStorage.setItem('sdc_v83_theme','light');
    }catch(err){ console.warn('No se pudo limpiar storage temporal',err); }
  }

  async function hardRefresh(){
    const btn=document.querySelector('[data-sdc-hard-refresh]');
    if(btn){
      btn.disabled=true;
      btn.classList.add('is-updating');
      const text=btn.querySelector('.sdc-refresh-text-v103');
      if(text) text.textContent='Actualizando';
    }
    toast('Actualizando sistema y borrando caché...');
    await clearBrowserCaches();
    cleanLocalRuntimeCache();
    const url=new URL(window.location.href);
    url.searchParams.set('v','108');
    url.searchParams.set('t',Date.now().toString());
    window.location.replace(url.toString());
  }

  document.addEventListener('click',ev=>{
    const btn=ev.target.closest('[data-sdc-hard-refresh]');
    if(!btn) return;
    ev.preventDefault();
    ev.stopPropagation();
    hardRefresh();
  },true);

  document.addEventListener('click',ev=>{
    const syncBtn=ev.target.closest('[data-sdc-utility-sync]');
    if(!syncBtn) return;
    ev.preventDefault();
    ev.stopPropagation();
    const target=[...document.querySelectorAll('[data-action="sync"]')].find(btn=>btn!==syncBtn);
    if(target){ target.click(); return; }
    toast('Actualizando Firebase...');
  },true);

  document.addEventListener('DOMContentLoaded',ensureButton,{passive:true});
  window.addEventListener('load',ensureButton,{passive:true});
  const mo=new MutationObserver(ensureButton);
  mo.observe(document.documentElement,{childList:true,subtree:true});
})();


;/* ==== js/sdc-v127-menu-stable.js ==== */

/* SDC V179: menú premium azul, compacto y moderno. */
(function(){
  'use strict';

  const STORE_KEY = 'sdc_control_ventas_v90';
  const LOGO = 'assets/logo-sdc.png';
  let bound = false;

  function ensureCss(){ return; }

  function state(){
    try{ return window.SDCStore && window.SDCStore.load ? window.SDCStore.load() : JSON.parse(localStorage.getItem(STORE_KEY)||'{}'); }
    catch(e){ return {products:[],sales:[],quotes:[]}; }
  }
  function n(v){ return Number(v)||0; }
  function money(v){ return 'Lps. ' + n(v).toLocaleString('es-HN',{maximumFractionDigits:0}); }
  function esc(s){ return String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m])); }
  function stock(p){ return Array.isArray(p.colors)&&p.colors.length ? p.colors.reduce((a,r)=>a+n(r.qty),0) : n(p.stock); }
  function totalSale(s){ return n(s.total)||n(s.grandTotal)||(s.items||[]).reduce((a,it)=>a+n(it.total||n(it.price)*n(it.qty||1)),0); }
  function profitSale(s){ return (s.items||[]).reduce((a,it)=>a+(n(it.price)-n(it.cost))*n(it.qty||1),0); }
  function isToday(d){ const a=new Date(d||Date.now()), b=new Date(); return a.getFullYear()===b.getFullYear() && a.getMonth()===b.getMonth() && a.getDate()===b.getDate(); }
  function toast(msg){ const el=document.getElementById('toast'); if(el){ el.textContent=msg; el.classList.add('show'); clearTimeout(el._v127); el._v127=setTimeout(()=>el.classList.remove('show'),2200); } }

  function removeOldMenu(){
    document.querySelectorAll('.sdc-menu-fab-v116,.sdc-menu-backdrop-v116,.sdc-menu-drawer-v116').forEach(el=>el.remove());
  }
  function openMenu(){ document.body.classList.add('sdc-menu-open-v116'); }
  function closeMenu(){ document.body.classList.remove('sdc-menu-open-v116'); }
  function closePanels(){ document.querySelectorAll('.sdc-menu-modal-v116').forEach(el=>el.remove()); }

  function menuIcon(name){
    const icons = {
      home:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 11.2 12 4l9 7.2v8.3a1.5 1.5 0 0 1-1.5 1.5h-4.2v-6.4H8.7V21H4.5A1.5 1.5 0 0 1 3 19.5v-8.3Z"/></svg>',
      grid:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 4h6v6H4V4Zm10 0h6v6h-6V4ZM4 14h6v6H4v-6Zm10 0h6v6h-6v-6Z"/></svg>',
      bolt:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13 2 4.8 13.4h6L9.7 22 19.2 9.7h-6.1L13 2Z"/></svg>',
      file:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3h8l4 4v14H6V3Zm7 1.8V8h3.2M8.7 12h6.6M8.7 16h6.6"/></svg>',
      dollar:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v18M16.5 7.4c-1-1-2.5-1.5-4-1.5-2.2 0-4 1-4 2.8 0 4 8 1.7 8 5.8 0 1.8-1.8 3-4.2 3-1.9 0-3.8-.7-4.9-2"/></svg>',
      receipt:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3h12v18l-2.2-1.3-2.1 1.3-2.1-1.3L9.5 21 6 19V3Zm3 6h6M9 13h6M9 17h4"/></svg>',
      bell:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 10.8c0-3.2-2.2-5.5-6-5.5s-6 2.3-6 5.5v4.4L4.4 18h15.2L18 15.2v-4.4ZM9.8 20.2h4.4"/></svg>',
      box:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 4.5 7v10L12 21l7.5-4V7L12 3Zm0 0v8m7.5-4L12 11 4.5 7"/></svg>',
      cart:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h2l1.4 9.2h9.8L19.5 8H7.1M9 19.2h.1M17 19.2h.1"/></svg>',
      shield:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 19 6v5.8c0 4.2-2.7 7.4-7 9.2-4.3-1.8-7-5-7-9.2V6l7-3Z"/></svg>',
      arrow:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 5 7 7-7 7"/></svg>'
    };
    return icons[name] || icons.grid;
  }

  function menuItem(action, icon, title, subtitle, extraClass=''){
    return `<button class="sdc-menu-item-v116 sdc-menu-item-v179 ${extraClass}" type="button" data-sdc127="${action}">
      <i>${menuIcon(icon)}</i><span>${title}</span><small>${subtitle}</small>
    </button>`;
  }

  function renderMenu(){
    removeOldMenu();
    document.body.insertAdjacentHTML('beforeend', `
      <button class="sdc-menu-fab-v116 no-print" type="button" data-sdc127="open" aria-label="Abrir menú">☰</button>
      <div class="sdc-menu-backdrop-v116 no-print" data-sdc127="close"></div>
      <aside class="sdc-menu-drawer-v116 sdc-menu-drawer-v179 no-print" aria-label="Menú de SD Comayagua" role="dialog" aria-modal="true">
        <div class="sdc-menu-head-v116 sdc-menu-head-v179">
          <div class="sdc-menu-brand-v116 sdc-menu-brand-v179"><img src="${LOGO}" alt="SD"><div><b>SD Comayagua</b><span>Accesos rápidos</span></div></div>
          <button class="sdc-menu-close-v116 sdc-menu-close-v179" type="button" data-sdc127="close" aria-label="Cerrar menú">×</button>
        </div>

        <button class="sdc-menu-feature-v179" type="button" data-sdc127="vender">
          <i>${menuIcon('cart')}</i>
          <span><b>Vender</b><small>Crear nuevo recibo</small></span>
          <em>${menuIcon('arrow')}</em>
        </button>

        <div class="sdc-menu-separator-v179"></div>
        <p class="sdc-menu-kicker-v179">Menú</p>

        <div class="sdc-menu-grid-v116 sdc-menu-grid-v179">
          ${menuItem('inicio','home','Inicio','Panel principal')}
          ${menuItem('productos','grid','Productos','Catálogo')}
          ${menuItem('vender','bolt','Vender','Crear recibo')}
          ${menuItem('cotizar','file','Cotizar','Nueva cotización')}
          ${menuItem('ganancias','dollar','Ganancias','Utilidad y reportes')}
          ${menuItem('recibos','receipt','Recibos','Historial de caja')}
          ${menuItem('alertas','bell','Alertas','Inventario y más')}
          ${menuItem('nuevo','box','Inventario','Stock y existencias')}
        </div>

        <button class="sdc-menu-footer-v179" type="button" data-sdc127="productos">
          <i>${menuIcon('shield')}</i>
          <span><b>SD Comayagua</b><small>Soluciones para tu negocio</small></span>
          <em>${menuIcon('arrow')}</em>
        </button>
      </aside>`);
  }

  function goPage(page){
    closeMenu();
    closePanels();
    if(window.SDCSetPageV97) window.SDCSetPageV97(page,{smooth:false});
    else { localStorage.setItem('sdc_v97_page', page); location.reload(); }
  }

  function findVisibleButton(words){
    const list = Array.from(document.querySelectorAll('button,a,[role="button"]'));
    const targets = words.map(w=>w.toLowerCase());
    for(const el of list){
      if(el.closest('.sdc-menu-drawer-v116,.sdc-menu-modal-v116')) continue;
      const box = el.getBoundingClientRect();
      const visible = box.width > 4 && box.height > 4;
      if(!visible) continue;
      const txt = (el.textContent || el.getAttribute('aria-label') || '').toLowerCase().replace(/\s+/g,' ').trim();
      if(targets.some(w=>txt.includes(w))) return el;
    }
    return null;
  }

  function runHomeButton(words, fallbackMsg){
    closeMenu();
    closePanels();
    goPage('inicio');
    setTimeout(()=>{
      const btn = findVisibleButton(words);
      if(btn) btn.click();
      else toast(fallbackMsg || 'No encontré el botón en Inicio.');
    }, 260);
  }

  function modal(title, html){
    closeMenu();
    closePanels();
    const div = document.createElement('div');
    div.className = 'sdc-menu-modal-v116';
    div.innerHTML = `<section class="sdc-menu-modal-card-v116" role="dialog" aria-modal="true">
      <header class="sdc-menu-modal-head-v116"><h3>${esc(title)}</h3><button type="button" data-sdc127-panel-close>×</button></header>
      <div class="sdc-menu-modal-body-v116">${html}</div>
    </section>`;
    div.addEventListener('click', ev=>{ if(ev.target===div || ev.target.closest('[data-sdc127-panel-close]')) closePanels(); });
    document.body.appendChild(div);
  }

  function openGains(){
    const s=state(), products=s.products||[], sales=s.sales||[];
    const invested = products.reduce((a,p)=>a+n(p.cost)*stock(p),0);
    const estimated = products.reduce((a,p)=>a+(n(p.price)-n(p.cost))*stock(p),0);
    const todayProfit = sales.filter(x=>isToday(x.date)).reduce((a,x)=>a+profitSale(x),0);
    const rows = products.slice(0,25).map(p=>`<div class="sdc-list-row-v116"><div><b>${esc(p.name)}</b><span>Costo ${money(p.cost)} · Venta ${money(p.price)} · Stock ${stock(p)}</span></div><em class="sdc-pill-v116">${money(n(p.price)-n(p.cost))}</em></div>`).join('');
    modal('Ganancias', `<div class="sdc-mini-stats-v116"><div class="sdc-mini-stat-v116"><span>Ganancia estimada</span><b>${money(estimated)}</b></div><div class="sdc-mini-stat-v116"><span>Invertido</span><b>${money(invested)}</b></div><div class="sdc-mini-stat-v116"><span>Ganancia hoy</span><b>${money(todayProfit)}</b></div><div class="sdc-mini-stat-v116"><span>Productos</span><b>${products.length}</b></div></div><div class="sdc-list-v116">${rows || '<div class="sdc-empty-v116">No hay productos.</div>'}</div>`);
  }

  function openReceipts(){
    const s=state(), sales=s.sales||[], todaySales=sales.filter(x=>isToday(x.date));
    const rows = sales.slice(0,40).map(x=>`<div class="sdc-list-row-v116"><div><b>${esc(x.client||'Cliente')}</b><span>${esc(x.id||'Recibo')} · ${new Date(x.date||Date.now()).toLocaleString('es-HN')}</span></div><em class="sdc-pill-v116">${money(totalSale(x))}</em></div>`).join('');
    modal('Recibos / Caja', `<div class="sdc-mini-stats-v116"><div class="sdc-mini-stat-v116"><span>Ventas hoy</span><b>${money(todaySales.reduce((a,x)=>a+totalSale(x),0))}</b></div><div class="sdc-mini-stat-v116"><span>Recibos hoy</span><b>${todaySales.length}</b></div></div><div class="sdc-list-v116">${rows || '<div class="sdc-empty-v116">Todavía no hay recibos.</div>'}</div>`);
  }

  function openAlerts(){
    const s=state(), products=s.products||[], alerts=[];
    products.forEach(p=>{
      if(stock(p)<=0) alerts.push([p.name,'Stock en cero','Agotado']);
      else if(stock(p)<=3) alerts.push([p.name,`Solo ${stock(p)} unidades`,'Bajo stock']);
      if(!String(p.image||p.gallery||'').trim()) alerts.push([p.name,'Agrega imagen','Sin foto']);
      if(n(p.price)-n(p.cost)<10) alerts.push([p.name,`Ganancia ${money(n(p.price)-n(p.cost))}`,'Revisar']);
    });
    const rows=alerts.slice(0,70).map(x=>`<div class="sdc-list-row-v116"><div><b>${esc(x[0])}</b><span>${esc(x[1])}</span></div><em class="sdc-pill-v116">${esc(x[2])}</em></div>`).join('');
    modal('Alertas', `<div class="sdc-mini-stats-v116"><div class="sdc-mini-stat-v116"><span>Total alertas</span><b>${alerts.length}</b></div><div class="sdc-mini-stat-v116"><span>Productos</span><b>${products.length}</b></div></div><div class="sdc-list-v116">${rows || '<div class="sdc-empty-v116">No hay alertas.</div>'}</div>`);
  }

  function openQuotes(){
    const q=(state().quotes||[]);
    const rows=q.slice(0,40).map(x=>`<div class="sdc-list-row-v116"><div><b>${esc(x.client||'Cliente')}</b><span>${esc(x.id||'Cotización')} · ${new Date(x.date||Date.now()).toLocaleString('es-HN')}</span></div><em class="sdc-pill-v116">${money(totalSale(x))}</em></div>`).join('');
    modal('Cotizaciones', `<div class="sdc-list-v116">${rows || '<div class="sdc-empty-v116">No hay cotizaciones guardadas.</div>'}</div>`);
  }

  function newProduct(){
    closeMenu();
    closePanels();
    goPage('productos');
    setTimeout(()=>{
      const btn=findVisibleButton(['nuevo producto','+ producto','producto']);
      if(btn) btn.click();
      else toast('No encontré el botón Nuevo producto.');
    }, 300);
  }

  function handle(action){
    if(!action) return;
    if(action==='open') return openMenu();
    if(action==='close') return closeMenu();
    if(action==='inicio') return goPage('inicio');
    if(action==='productos') return goPage('productos');
    if(action==='vender') return runHomeButton(['vender ahora','vender'], 'Abre Inicio y toca Vender ahora.');
    if(action==='cotizar') return runHomeButton(['cotizar'], 'Abre Inicio y toca Cotizar.');
    if(action==='ganancias') return openGains();
    if(action==='recibos') return openReceipts();
    if(action==='alertas') return openAlerts();
    if(action==='cotizaciones') return openQuotes();
    if(action==='nuevo') return newProduct();
  }

  function bind(){
    if(bound) return;
    bound = true;
    document.addEventListener('click', ev=>{
      const node = ev.target.closest('[data-sdc127]');
      if(!node) return;
      ev.preventDefault();
      ev.stopPropagation();
      handle(node.dataset.sdc127);
    }, false);
    document.addEventListener('keydown', ev=>{ if(ev.key==='Escape'){ closeMenu(); closePanels(); } });
  }

  function boot(){
    ensureCss();
    renderMenu();
    bind();
  }

  window.SDCMenuV127 = {boot, openMenu, closeMenu};
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', boot, {once:true});
  else boot();
})();


;/* ==== js/sdc-v197-mobile-fixes.js ==== */

/* SDC V197 · navegación móvil corregida y aperturas directas */
(function(){
  'use strict';
  const $=(sel,root=document)=>root.querySelector(sel);
  const $$=(sel,root=document)=>Array.from(root.querySelectorAll(sel));
  const pageMap={inicio:'tabInicio',panel:'tabPanel',productos:'tabProductos'};

  function toast(msg){
    const el=document.getElementById('toast');
    if(el){
      el.textContent=msg;
      el.classList.add('show');
      clearTimeout(el._sdc197);
      el._sdc197=setTimeout(()=>el.classList.remove('show'),2200);
    }
  }
  function closeMenu(){ document.body.classList.remove('sdc-menu-open-v116'); }
  function closeLegacyPanels(){ $$('.sdc-menu-modal-v116').forEach(x=>x.remove()); }
  function closeAllOverlays(){ closeMenu(); closeLegacyPanels(); }
  function modalOpen(){ return !!$('#modalRoot .modal, #modalRoot .modal-backdrop'); }

  function app(){ return window.SDCAppV196 || window.SDCApp || null; }
  function appCall(name,...args){
    try{
      const api=app();
      if(api && typeof api[name]==='function'){
        api[name](...args);
        return true;
      }
    }catch(err){
      console.error('[SDC V197]',name,err);
    }
    return false;
  }
  function clickAction(action){
    const btn=document.querySelector(`[data-action="${action}"]`);
    if(btn){ btn.click(); return true; }
    return false;
  }
  function goPage(page){
    closeAllOverlays();
    try{ localStorage.setItem('sdc_v150_page',page); }catch(err){}
    if(appCall('setPage',page) || (window.SDCSetPageV150 && (window.SDCSetPageV150(page), true))){
      requestAnimationFrame(()=>window.scrollTo({top:0,behavior:'smooth'}));
      return true;
    }
    const btn=document.querySelector(`[data-action="${pageMap[page]||pageMap.inicio}"]`);
    if(btn){ btn.click(); requestAnimationFrame(()=>window.scrollTo({top:0,behavior:'smooth'})); return true; }
    return false;
  }

  function runOpen(methodName, fallbackAction, page='inicio'){
    closeAllOverlays();
    if(appCall(methodName)) return true;
    if(clickAction(fallbackAction)) return true;
    goPage(page);
    let done=false;
    const tries=[80,180,320,520];
    tries.forEach(delay=>setTimeout(()=>{
      if(done || modalOpen()) return;
      if(appCall(methodName) || clickAction(fallbackAction)) done=true;
    },delay));
    return true;
  }

  function handleAction(action){
    switch(action){
      case 'inicio': return goPage('inicio');
      case 'panel': return goPage('panel');
      case 'productos': return goPage('productos');
      case 'nuevo':
      case 'inventario':
        closeAllOverlays();
        if(appCall('openProductEditor')) return true;
        goPage('productos');
        setTimeout(()=>clickAction('newProduct')||toast('Abre Productos para agregar inventario.'),220);
        return true;
      case 'vender': return runOpen('openSale','sell','inicio');
      case 'cotizar': return runOpen('openQuote','quote','inicio');
      case 'ganancias': return runOpen('openProfit','profit','panel');
      case 'recibos': return runOpen('openReceipts','receipts','inicio');
      case 'alertas':
        closeAllOverlays();
        if(appCall('openAlertsV196')) return true;
        if(appCall('openNotifications')) return true;
        goPage('productos');
        setTimeout(()=>appCall('openAlertsV196')||appCall('openNotifications')||clickAction('notifications'),220);
        return true;
      case 'cotizaciones':
        closeAllOverlays();
        if(appCall('openSavedQuotes')) return true;
        goPage('inicio');
        setTimeout(()=>appCall('openSavedQuotes')||clickAction('quotes'),220);
        return true;
      default:
        return false;
    }
  }

  document.addEventListener('click',function(ev){
    const node=ev.target.closest && ev.target.closest('[data-sdc127]');
    if(!node) return;
    const action=(node.getAttribute('data-sdc127')||'').trim();
    if(!action || action==='open' || action==='close') return;
    const handled=handleAction(action);
    if(handled){
      ev.preventDefault();
      ev.stopPropagation();
      ev.stopImmediatePropagation();
    }
  },true);

  function polish(){
    document.documentElement.style.overflowX='hidden';
    document.body.style.overflowX='hidden';
    $$('.stats .stat b,.panel-stats-v150 article b').forEach(b=>{
      const txt=(b.textContent||'').trim();
      if(/^Lps\./i.test(txt)) b.classList.add('sdc197-money-fit');
    });
    if(modalOpen()) closeLegacyPanels();
  }
  const mo=new MutationObserver(polish);
  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',()=>{polish(); mo.observe(document.body,{childList:true,subtree:true});});
  }else{
    polish(); mo.observe(document.body,{childList:true,subtree:true});
  }
})();


;/* ==== js/sdc-v207-s24-ultra-polish.js ==== */


/* SD Comayagua · v207 S24 Ultra Mobile Pro */
(function(){
  'use strict';

  const $ = (sel, root=document) => root.querySelector(sel);
  const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));

  function setVars(){
    const root = document.documentElement;
    root.style.setProperty('--sdc-vh', `${window.innerHeight}px`);
    root.style.setProperty('--sdc-vw', `${window.innerWidth}px`);

    document.body.classList.add('sdc-v207-mobile-pro');
    document.body.classList.toggle('sdc-v207-handset', window.innerWidth <= 540);
    document.body.classList.toggle(
      'sdc-v207-s24-ultra-like',
      window.innerWidth <= 540 && window.innerHeight >= 780 && window.devicePixelRatio >= 2.4
    );
  }

  function noHorizontalLeak(){
    document.documentElement.style.overflowX = 'hidden';
    document.body.style.overflowX = 'hidden';

    const app = document.getElementById('app');
    if(app){
      app.style.maxWidth = window.innerWidth <= 760 ? '462px' : '';
      app.style.overflowX = 'hidden';
    }
  }

  function polishMoney(){
    $$('.stats .stat b,.panel-stats-v150 article b,.mini-stat-v195 b,.sdc204-total b,.sdc205-total b,.sdc206-total b').forEach(el=>{
      const txt=(el.textContent||'').trim();
      if(/^Lps\./i.test(txt) || txt.length > 8) el.classList.add('sdc207-fit-money');
    });
  }

  function polishModals(){
    const modalRoot = document.getElementById('modalRoot');
    if(!modalRoot) return;

    const hasModal = !!modalRoot.querySelector('.modal,.modal-backdrop');
    document.body.classList.toggle('sdc207-modal-open', hasModal);

    modalRoot.querySelectorAll('.quote-actions-v176,.modal-actions,.short-receipt-actions').forEach(el=>{
      el.style.position = 'static';
      el.style.bottom = 'auto';
      el.style.left = 'auto';
      el.style.right = 'auto';
      el.style.transform = 'none';
    });

    modalRoot.querySelectorAll('.modal').forEach(modal=>{
      modal.style.overflowX = 'hidden';
      modal.style.webkitOverflowScrolling = 'touch';
    });

    modalRoot.querySelectorAll('.picker-list,.picker-list-v200,.quote-category-list-v201').forEach(el=>{
      el.style.webkitOverflowScrolling = 'touch';
      el.style.overscrollBehavior = 'contain';
    });

    modalRoot.querySelectorAll('img').forEach(img=>{
      if(!img.getAttribute('loading')) img.setAttribute('loading','lazy');
      if(!img.getAttribute('decoding')) img.setAttribute('decoding','async');
    });
  }

  function improveLabels(){
    // Evita que labels automáticos tapen demasiado la foto.
    $$('.product-photo-v178').forEach(photo=>{
      const badge = photo.querySelector('.product-availability-v178');
      if(badge){
        badge.style.left = 'auto';
        badge.style.right = '7px';
      }
    });
  }

  function run(){
    setVars();
    noHorizontalLeak();
    polishMoney();
    polishModals();
    improveLabels();
  }

  let raf = 0;
  function schedule(){
    if(raf) return;
    raf = requestAnimationFrame(()=>{ raf = 0; run(); });
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', run, {once:true});
  }else{
    run();
  }

  window.addEventListener('resize', schedule, {passive:true});
  window.addEventListener('orientationchange', ()=>setTimeout(schedule, 220), {passive:true});

  const obs = new MutationObserver(schedule);
  if(document.body){
    obs.observe(document.body, {childList:true, subtree:true, attributes:true, attributeFilter:['class','style','src']});
  }else{
    document.addEventListener('DOMContentLoaded', ()=>{
      obs.observe(document.body, {childList:true, subtree:true, attributes:true, attributeFilter:['class','style','src']});
    }, {once:true});
  }
})();


;/* ==== js/sdc-v209-app-premium-final.js ==== */


/* SD Comayagua · v209 App Premium Final */
(function(){
  'use strict';
  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));

  const navItems=[
    ['tabInicio','Inicio','⌂'],
    ['tabProductos','Catálogo','▦'],
    ['quote','Cotizar','🧾'],
    ['sell','Vender','⚡'],
    ['receipts','Caja','▤']
  ];

  function ensureBottomNav(){
    if(document.querySelector('.sdc209-bottom-nav')) return;
    const nav=document.createElement('nav');
    nav.className='sdc209-bottom-nav no-print';
    nav.setAttribute('aria-label','Navegación rápida móvil');
    nav.innerHTML=navItems.map(([action,label,icon])=>`<button type="button" data-sdc209-nav="${action}" aria-label="${label}"><i>${icon}</i><span>${label}</span></button>`).join('');
    document.body.appendChild(nav);
    nav.addEventListener('click',ev=>{
      const btn=ev.target.closest('[data-sdc209-nav]');
      if(!btn) return;
      ev.preventDefault();
      const action=btn.dataset.sdc209Nav;
      runAction(action);
    });
  }

  function runAction(action){
    const candidates=$$(`[data-action="${CSS.escape(action)}"]`).filter(el=>!el.closest('.sdc209-bottom-nav'));
    const visible=candidates.find(el=>el.offsetParent!==null) || candidates[0];
    if(visible){ visible.click(); return; }

    // Fallbacks si en ese momento el botón no está renderizado.
    const map={
      tabInicio:'tabInicio',
      tabProductos:'tabProductos',
      quote:'quote',
      sell:'sell',
      receipts:'receipts'
    };
    const fallback=$(`[data-sdc127="${map[action]||action}"]`);
    if(fallback){ fallback.click(); return; }

    if(action==='tabInicio') window.scrollTo({top:0,behavior:'smooth'});
  }

  function updateActive(){
    const page=(document.body.dataset.sdcPageV150||'inicio').toLowerCase();
    const modalOpen=!!document.querySelector('#modalRoot .modal');
    document.body.classList.toggle('sdc209-has-modal',modalOpen);
    $$('.sdc209-bottom-nav [data-sdc209-nav]').forEach(btn=>{
      const action=btn.dataset.sdc209Nav;
      const active=(action==='tabInicio' && page==='inicio') || (action==='tabProductos' && page==='productos') || (action==='quote' && !!document.querySelector('#modalRoot .quote-modal-v176:not(.sale)')) || (action==='sell' && modalOpen && /venta|factura/i.test(document.querySelector('#modalRoot .modal-head h3')?.textContent||'')) || (action==='receipts' && modalOpen && /recibos|caja/i.test(document.querySelector('#modalRoot .modal-head h3')?.textContent||''));
      btn.classList.toggle('active',active);
    });
  }

  function polish(){
    ensureBottomNav();
    updateActive();

    // Evita acciones flotantes dentro de modales; quedan al final del contenido.
    $$('#modalRoot .quote-actions-v176,#modalRoot .modal-actions,#modalRoot .short-receipt-actions').forEach(el=>{
      el.style.position='static';
      el.style.inset='auto';
      el.style.transform='none';
    });

    // Ajuste de textos largos en productos, recibos y métricas.
    $$('.product-card h3,.picker-item b,.cart-row b,.sdc208-line-copy b,.sdc209-mini-card b').forEach(el=>{
      el.style.overflowWrap='anywhere';
    });

    // Al abrir modal, asegurarse de que empiece arriba.
    const modal=$('#modalRoot .modal');
    if(modal && modal.dataset.sdc209Top!=='1'){
      modal.dataset.sdc209Top='1';
      modal.scrollTop=0;
      const body=$('#modalRoot .modal-body');
      if(body) body.scrollTop=0;
    }
  }

  let raf=0;
  function schedule(){
    if(raf) return;
    raf=requestAnimationFrame(()=>{raf=0;polish();});
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',polish,{once:true});
  else polish();

  window.addEventListener('resize',schedule,{passive:true});
  window.addEventListener('orientationchange',()=>setTimeout(schedule,200),{passive:true});
  new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['class','data-sdc-page-v150','style']});
})();


;/* ==== js/sdc-v210-s24-ultra-pro-max.js ==== */


/* SD Comayagua · v210 App Premium Final */
(function(){
  'use strict';

  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
  const KEY='sdc_control_ventas_v90';
  const steps=[
    ['products','Productos','📦'],
    ['list','Lista','🧾'],
    ['client','Cliente','👤'],
    ['preview','Vista','👁'],
    ['send','Enviar','↗']
  ];

  function safeState(){
    try{
      if(window.SDCStore && typeof window.SDCStore.load==='function') return window.SDCStore.load();
      return JSON.parse(localStorage.getItem(KEY)||'{}')||{};
    }catch(e){ return {}; }
  }

  function money(n){
    const v=Math.round(Number(n)||0);
    return `Lps. ${v.toLocaleString('es-HN')}`;
  }

  function productStock(p){
    if(!p) return 0;
    if(Array.isArray(p.colors)){
      return p.colors.reduce((a,c)=>a+(Number(c.qty)||0),0);
    }
    if(Array.isArray(p.colorRows)){
      return p.colorRows.reduce((a,c)=>a+(Number(c.qty)||0),0);
    }
    return Number(p.stock ?? p.qty ?? p.quantity ?? p.cantidad ?? 0) || 0;
  }

  function productPrice(p){
    return Number(p?.price ?? p?.precio ?? p?.salePrice ?? 0) || 0;
  }

  function productCost(p){
    return Number(p?.cost ?? p?.costo ?? 0) || 0;
  }

  function productImage(p){
    return String(p?.image || p?.foto || p?.img || p?.photo || '').trim();
  }

  function isHidden(p){
    return p?.hidden || p?.oculto || p?.visible===false || p?.status==='hidden';
  }

  function realProducts(){
    const st=safeState();
    return (st.products||[]).filter(p=>p && !isHidden(p));
  }

  function todaySales(){
    const st=safeState();
    const today=new Date().toLocaleDateString('es-HN');
    return (st.sales||[]).filter(s=>{
      try{return new Date(s.date||s.createdAt||0).toLocaleDateString('es-HN')===today}catch(e){return false}
    });
  }

  function calcMetrics(){
    const products=realProducts();
    const units=products.reduce((a,p)=>a+productStock(p),0);
    const saleValue=products.reduce((a,p)=>a+productStock(p)*productPrice(p),0);
    const invested=products.reduce((a,p)=>a+productStock(p)*productCost(p),0);
    const today=todaySales();
    const soldToday=today.reduce((a,s)=>a+Number(s.total||s.amount||0),0);
    const low=products.filter(p=>productStock(p)>0 && productStock(p)<=2).length;
    const out=products.filter(p=>productStock(p)<=0).length;
    const noImg=products.filter(p=>!productImage(p)).length;
    const zeroProfit=products.filter(p=>productPrice(p)>0 && productPrice(p)-productCost(p)<=0).length;
    return {products,units,saleValue,invested,profit:saleValue-invested,today,soldToday,low,out,noImg,zeroProfit};
  }

  function toast(msg){
    if(window.SDCApp && typeof window.SDCApp.toast==='function') return window.SDCApp.toast(msg);
    const el=document.getElementById('toast');
    if(el){ el.textContent=msg; el.classList.add('show'); setTimeout(()=>el.classList.remove('show'),2400); }
  }

  function clickAction(action){
    const el=$$(`[data-action="${CSS.escape(action)}"]`).find(x=>x.offsetParent!==null) || $(`[data-action="${CSS.escape(action)}"]`);
    if(el){ el.click(); return true; }
    return false;
  }

  function runAction(action){
    const api=window.SDCApp||{};
    if(action==='quote' && typeof api.openQuote==='function') return api.openQuote();
    if(action==='sell' && typeof api.openSale==='function') return api.openSale();
    if(action==='products'){
      if(typeof api.setPage==='function') return api.setPage('productos');
      return clickAction('tabProductos');
    }
    if(action==='inicio'){
      if(typeof api.setPage==='function') return api.setPage('inicio');
      return clickAction('tabInicio');
    }
    if(action==='receipts' && typeof api.openReceipts==='function') return api.openReceipts();
    if(action==='categories' && typeof api.openCategoriesSheet==='function') return api.openCategoriesSheet();
    if(action==='alerts') return openSmartAlerts();
    if(action==='client') return toggleClientMode();
  }

  function ensureS24Panel(){
    const app=document.getElementById('app');
    if(!app || document.querySelector('#modalRoot .modal')) return;

    let panel=document.querySelector('.sdc210-s24-panel');
    const m=calcMetrics();

    const html=`<div class="sdc210-panel-head">
      <div><span>Accesos rápidos</span><b>Panel de ventas</b></div>
      <button type="button" class="sdc210-mode-pill" data-sdc210="client">${document.body.classList.contains('sdc210-client-mode')?'Cliente activo':'Modo cliente'}</button>
    </div>
    <div class="sdc210-action-grid">
      <button class="primary" type="button" data-sdc210="sell"><i>⚡</i><b>Nueva venta</b><small>factura real</small></button>
      <button type="button" data-sdc210="quote"><i>🧾</i><b>Cotizar</b><small>previa para cliente</small></button>
      <button type="button" data-sdc210="products"><i>▦</i><b>Catálogo</b><small>productos</small></button>
      <button type="button" data-sdc210="alerts"><i>🔔</i><b>Alertas</b><small>${m.low+m.out+m.noImg} pendientes</small></button>
    </div>
    <div class="sdc210-mini-metrics">
      <article><b>${m.products.length}</b><span>productos</span></article>
      <article><b>${m.units}</b><span>unidades</span></article>
      <article><b>${money(m.soldToday)}</b><span>ventas hoy</span></article>
    </div>`;

    if(panel){
      panel.innerHTML=html;
      return;
    }

    panel=document.createElement('section');
    panel.className='sdc210-s24-panel no-print';
    panel.innerHTML=html;

    // Insertar después de la cabecera principal si existe; si no, al inicio.
    const anchor=app.querySelector('.sdc-hero-v178,.home-hero,.hero-card,.sdc-header,.brand-hero') || app.firstElementChild;
    if(anchor && anchor.parentNode===app) anchor.insertAdjacentElement('afterend',panel);
    else app.insertBefore(panel,app.firstChild);

    panel.addEventListener('click',ev=>{
      const btn=ev.target.closest('[data-sdc210]');
      if(!btn) return;
      ev.preventDefault();
      runAction(btn.dataset.sdc210);
    });
  }

  function toggleClientMode(){
    document.body.classList.toggle('sdc210-client-mode');
    const on=document.body.classList.contains('sdc210-client-mode');
    try{ localStorage.setItem('sdc210_client_mode', on?'1':'0'); }catch(e){}
    toast(on?'Modo cliente activado: se oculta información interna.':'Modo cliente desactivado.');
    ensureS24Panel();
  }

  function restoreClientMode(){
    try{
      if(localStorage.getItem('sdc210_client_mode')==='1') document.body.classList.add('sdc210-client-mode');
    }catch(e){}
  }

  function openSmartAlerts(){
    const api=window.SDCApp||{};
    const products=realProducts();
    const groups=[
      ['Bajo stock','Quedan 1 o 2 unidades',products.filter(p=>productStock(p)>0 && productStock(p)<=2),'⚠️'],
      ['Agotados','Stock en cero',products.filter(p=>productStock(p)<=0),'⛔'],
      ['Sin imagen','Necesitan foto o imagen automática',products.filter(p=>!productImage(p)),'🖼️'],
      ['Ganancia en cero','Revisar costo/precio',products.filter(p=>productPrice(p)>0 && productPrice(p)-productCost(p)<=0),'💵']
    ];

    const body=groups.map(([title,desc,list,icon])=>{
      const rows=list.slice(0,6).map(p=>`<div class="sdc210-alert-row">
        <div><b>${escapeHtml(p.name||'Producto')}</b><span>Stock ${productStock(p)} · Precio ${money(productPrice(p))}</span></div>
        <button type="button" data-sdc210-edit="${escapeHtml(p.id||'')}">Editar</button>
      </div>`).join('') || `<div class="sdc210-alert-row"><div><b>Todo bien</b><span>No hay pendientes en esta sección.</span></div></div>`;
      return `<article class="sdc210-alert-card">
        <header><div><h4>${icon} ${title}</h4><small>${desc}</small></div><span class="count">${list.length}</span></header>
        <div class="sdc210-alert-list">${rows}${list.length>6?`<div class="sdc210-alert-row"><div><b>+${list.length-6} más</b><span>Usa el panel de inventario para revisar el resto.</span></div></div>`:''}</div>
      </article>`;
    }).join('');

    if(typeof window.SDCOpenModalV210==='function') return window.SDCOpenModalV210(body);

    const modalRoot=document.getElementById('modalRoot');
    if(!modalRoot){ if(typeof api.openNotifications==='function') return api.openNotifications(); return; }
    modalRoot.innerHTML=`<div class="modal-backdrop"><div class="modal wide">
      <div class="modal-head"><h3>Alertas inteligentes</h3><button class="close">×</button></div>
      <div class="modal-body"><div class="sdc210-alert-grid">${body}</div></div>
    </div></div>`;
    modalRoot.querySelector('.close')?.addEventListener('click',()=>{modalRoot.innerHTML='';});
    modalRoot.querySelector('.modal-backdrop')?.addEventListener('click',ev=>{ if(ev.target.classList.contains('modal-backdrop')) modalRoot.innerHTML=''; });
    modalRoot.querySelectorAll('[data-sdc210-edit]').forEach(btn=>{
      btn.addEventListener('click',()=>{
        const id=btn.getAttribute('data-sdc210-edit');
        modalRoot.innerHTML='';
        if(id && api.openProductEditor) api.openProductEditor(id);
      });
    });
  }

  function escapeHtml(v){
    return String(v??'').replace(/[&<>"']/g,m=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[m]));
  }

  function getQuoteModal(){
    const modal=$('#modalRoot .modal');
    if(!modal) return null;
    if(!modal.querySelector('.quote-body-v176,#currentDocBox,#pickerCardBox')) return null;
    return modal;
  }

  function readTotals(modal){
    const productsText=modal.querySelector('#productsMini')?.textContent?.trim() || 'Lps. 0';
    const countText=modal.querySelector('#selectedCountPill')?.textContent?.trim() || '0 artículos';
    return {productsText,countText};
  }

  function ensureWizard(){
    const modal=getQuoteModal();
    if(!modal) return;

    const body=modal.querySelector('.quote-body-v176');
    if(!body) return;

    body.classList.add('sdc210-wizard-mode');
    if(!body.dataset.step) body.dataset.step='products';

    if(!body.querySelector('.sdc210-wizard-tabs')){
      const tabs=document.createElement('div');
      tabs.className='sdc210-wizard-tabs no-print';
      tabs.innerHTML=steps.map(([key,label,icon])=>`<button type="button" data-sdc210-step="${key}"><i>${icon}</i><span>${label}</span></button>`).join('');
      const old=body.querySelector('.quote-jumpbar');
      if(old) old.insertAdjacentElement('afterend',tabs);
      else body.insertBefore(tabs,body.firstChild);

      tabs.addEventListener('click',ev=>{
        const btn=ev.target.closest('[data-sdc210-step]');
        if(!btn) return;
        setStep(body,btn.dataset.sdc210Step);
      });
    }

    const grid=body.querySelector('.quote-grid-v176,.modal-grid');
    if(grid && !body.querySelector('.sdc210-step-controls')){
      const controls=document.createElement('div');
      controls.className='sdc210-step-controls no-print';
      controls.innerHTML='<button type="button" data-sdc210-prev>← Anterior</button><button type="button" class="next" data-sdc210-next>Siguiente →</button>';
      grid.insertAdjacentElement('afterend',controls);
      controls.addEventListener('click',ev=>{
        if(ev.target.closest('[data-sdc210-prev]')) moveStep(body,-1);
        if(ev.target.closest('[data-sdc210-next]')) moveStep(body,1);
      });
    }

    if(!body.querySelector('.sdc210-smart-cart')){
      const cart=document.createElement('div');
      cart.className='sdc210-smart-cart hidden no-print';
      cart.innerHTML='<div><b>Carrito</b><span>0 artículos · Lps. 0</span></div><button type="button">Ver lista</button>';
      body.appendChild(cart);
      cart.addEventListener('click',()=>setStep(body,'list'));
    }

    refreshWizard(body);
  }

  function setStep(body,step){
    if(!steps.some(x=>x[0]===step)) step='products';
    body.dataset.step=step;
    refreshWizard(body);
    const scrollers=[body.closest('.modal-backdrop'), body, body.closest('.modal-body'), body.closest('.modal')].filter(Boolean);
    scrollers.forEach(el=>{
      try{ el.scrollTo({top:0,behavior:'smooth'}); }
      catch(err){ el.scrollTop=0; }
    });
  }

  function moveStep(body,dir){
    const current=body.dataset.step || 'products';
    const idx=Math.max(0,steps.findIndex(x=>x[0]===current));
    const next=steps[Math.min(steps.length-1,Math.max(0,idx+dir))][0];
    setStep(body,next);
  }

  function refreshWizard(body){
    const step=body.dataset.step || 'products';
    body.querySelectorAll('[data-sdc210-step]').forEach(btn=>btn.classList.toggle('active',btn.dataset.sdc210Step===step));

    const prev=body.querySelector('[data-sdc210-prev]');
    const next=body.querySelector('[data-sdc210-next]');
    const idx=steps.findIndex(x=>x[0]===step);
    if(prev) prev.disabled=idx<=0;
    if(next) next.textContent=idx>=steps.length-1?'Listo':'Siguiente →';

    const modal=body.closest('.modal');
    const cart=body.querySelector('.sdc210-smart-cart');
    if(cart && modal){
      const {productsText,countText}=readTotals(modal);
      const has=!/^0\s/.test(countText) && !/^0 artículo/i.test(countText);
      cart.classList.toggle('hidden',!has);
      cart.querySelector('span').textContent=`${countText} · ${productsText}`;
    }
  }

  function polishBottomNav(){
    const nav=document.querySelector('.sdc209-bottom-nav');
    if(!nav) return;
    nav.querySelectorAll('[data-sdc209-nav]').forEach(btn=>{
      const action=btn.getAttribute('data-sdc209-nav');
      if(action==='tabInicio') btn.querySelector('span') && (btn.querySelector('span').textContent='Inicio');
      if(action==='tabProductos') btn.querySelector('span') && (btn.querySelector('span').textContent='Catálogo');
      if(action==='quote') btn.querySelector('span') && (btn.querySelector('span').textContent='Cotizar');
      if(action==='sell') btn.querySelector('span') && (btn.querySelector('span').textContent='Vender');
      if(action==='receipts') btn.querySelector('span') && (btn.querySelector('span').textContent='Caja');
    });
  }

  function polish(){
    document.body.classList.add('sdc-v210-s24');
    restoreClientMode();
    ensureS24Panel();
    ensureWizard();
    polishBottomNav();

    // Evita scroll horizontal por cualquier parche anterior.
    document.documentElement.style.overflowX='hidden';
    document.body.style.overflowX='hidden';
    const app=document.getElementById('app');
    if(app) app.style.overflowX='hidden';

    // Más robustez en valores largos.
    $$('.stats .stat b,.panel-stats-v150 article b,.sdc210-mini-metrics b').forEach(el=>{
      if((el.textContent||'').length>6) el.style.overflowWrap='anywhere';
    });
  }

  let raf=0;
  function schedule(){
    if(raf) return;
    raf=requestAnimationFrame(()=>{raf=0;polish();});
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',polish,{once:true});
  else polish();

  window.addEventListener('resize',schedule,{passive:true});
  window.addEventListener('orientationchange',()=>setTimeout(schedule,220),{passive:true});

  const obs=new MutationObserver(schedule);
  if(document.body) obs.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class','style','data-step','data-sdc-page-v150']});
})();


;/* ==== js/sdc-v211-textos-limpios.js ==== */

/* SD Comayagua · v211 Textos limpios */
(function(){
  'use strict';
  const replacements = [
    ['Modo S24 Ultra','Accesos rápidos'],
    ['S24 Ultra','móvil'],
    ['Galaxy móvil','celular'],
    ['Galaxy S24 Ultra','celular'],
    ['Panel móvil premium','Panel de ventas'],
    ['Optimizado para celular ·',''],
    ['Optimizado para móvil ·',''],
    ['Optimizado para Galaxy S24 Ultra ·',''],
    ['optimizada para Galaxy S24 Ultra','lista para uso móvil diario'],
    ['optimizada para celular','móvil'],
    ['Abriendo la versión optimizada para celular.','Abriendo el panel móvil de ventas.']
  ];
  function cleanTextNode(node){
    let v=node.nodeValue;
    let next=v;
    replacements.forEach(([a,b])=>{ next=next.split(a).join(b); });
    if(next!==v) node.nodeValue=next.replace(/\s+·\s+·\s+/g,' · ').replace(/^\s+|\s+$/g,'');
  }
  function walk(root){
    const walker=document.createTreeWalker(root||document.body,NodeFilter.SHOW_TEXT,{acceptNode(node){
      const p=node.parentElement;
      if(!p) return NodeFilter.FILTER_REJECT;
      if(['SCRIPT','STYLE','TEXTAREA','INPUT'].includes(p.tagName)) return NodeFilter.FILTER_REJECT;
      return /S24|Ultra|Optimizado|optimizada|Panel móvil premium|versión optimizada/.test(node.nodeValue||'')?NodeFilter.FILTER_ACCEPT:NodeFilter.FILTER_REJECT;
    }});
    const nodes=[];
    while(walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(cleanTextNode);
  }
  function polish(){
    document.body.classList.add('sdc-v211-clean-copy');
    walk(document.body);
    const panel=document.querySelector('.sdc210-s24-panel');
    if(panel){
      const label=panel.querySelector('.sdc210-panel-head span');
      const title=panel.querySelector('.sdc210-panel-head b');
      if(label) label.textContent='Accesos rápidos';
      if(title) title.textContent='Panel de ventas';
    }
  }
  let raf=0;
  function schedule(){
    if(raf) return;
    raf=requestAnimationFrame(()=>{raf=0;polish();});
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',polish,{once:true});
  else polish();
  new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true,characterData:true});
})();


;/* ==== js/sdc-v212-home-panel-order.js ==== */

/* SD Comayagua · v212 Inicio limpio */
(function(){
  'use strict';

  function page(){
    return document.body?.dataset?.sdcPageV150 || '';
  }

  function polishHomePanel(){
    document.body.classList.add('sdc-v212-home-panel-control');

    const app=document.getElementById('app');
    if(!app) return;

    const header=app.querySelector('header.sdc-top-v178');
    const panel=app.querySelector('.sdc210-s24-panel');

    if(panel){
      const label=panel.querySelector('.sdc210-panel-head span');
      const title=panel.querySelector('.sdc210-panel-head b');
      if(label) label.textContent='Accesos rápidos';
      if(title) title.textContent='Inicio rápido';
    }

    if(panel && header && page()==='inicio'){
      if(header.nextElementSibling !== panel){
        header.insertAdjacentElement('afterend', panel);
      }
    }
  }

  let raf=0;
  function schedule(){
    if(raf) return;
    raf=requestAnimationFrame(()=>{
      raf=0;
      polishHomePanel();
    });
  }

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded', polishHomePanel, {once:true});
  }else{
    polishHomePanel();
  }

  new MutationObserver(schedule).observe(document.documentElement,{subtree:true,childList:true,characterData:true,attributes:true});
})();


;/* ==== js/sdc-v129-photo-editor.js ==== */

/* SDC V136: editor de imágenes + carga final de CSS/JS para desktop, S24 Ultra, logo, recibos y menú estable. */
(function(){
  'use strict';
  if(window.SDCV129PhotoEditor) return;
  window.SDCV129PhotoEditor = true;

  function ensureCss(){
    // v305: los estilos antiguos ya están consolidados en el bundle principal.
  }

  function ensureScripts(){
    // v305: se evita pedir js/sdc-v135-menu-actions-final.js porque ya no existe en el proyecto.
  }

  function toast(msg){
    const el=document.getElementById('toast');
    if(el){
      el.textContent=msg;
      el.classList.add('show');
      clearTimeout(el._v129);
      el._v129=setTimeout(()=>el.classList.remove('show'),2300);
    }
  }

  function enhanceRow(row,index){
    if(!row || row.dataset.sdcV129Enhanced==='1') return;
    const input=row.querySelector('input[data-upload-image]');
    const url=row.querySelector('.pImageUrl');
    const del=row.querySelector('[data-delimage]');
    const actions=row.querySelector('.image-row-actions-v83') || row.querySelector('.image-row-actions');
    if(!input || !actions) return;

    row.dataset.sdcV129Enhanced='1';

    const oldLabel=input.closest('label');
    if(oldLabel){
      oldLabel.classList.add('sdc-v129-native-input-holder');
      oldLabel.setAttribute('aria-hidden','true');
      oldLabel.hidden = true;
    }

    const tools=document.createElement('div');
    tools.className='sdc-v129-photo-tools';
    tools.innerHTML=`
      <button class="sdc-v129-photo-btn camera" type="button" data-sdc-v129-camera>📷 <span>Tomar foto</span></button>
      <button class="sdc-v129-photo-btn gallery" type="button" data-sdc-v129-gallery>🖼️ <span>Galería</span></button>
    `;

    actions.prepend(tools);
    if(oldLabel && oldLabel.parentNode === actions){
      actions.removeChild(oldLabel);
      actions.appendChild(input);
      input.classList.add('sdc-v129-hidden-input');
      input.hidden = true;
    }
    if(del){
      del.classList.add('sdc-v129-remove-photo');
      del.textContent='Quitar imagen';
      actions.appendChild(del);
    }

    const openPicker=(camera)=>{
      try{
        input.value='';
        input.setAttribute('accept','image/*');
        if(camera) input.setAttribute('capture','environment');
        else input.removeAttribute('capture');
        input.click();
      }catch(err){
        toast('No se pudo abrir la cámara o galería.');
      }
    };

    tools.querySelector('[data-sdc-v129-camera]').addEventListener('click',e=>{e.preventDefault();openPicker(true);});
    tools.querySelector('[data-sdc-v129-gallery]').addEventListener('click',e=>{e.preventDefault();openPicker(false);});

    input.addEventListener('change',()=>{
      const file=input.files && input.files[0];
      if(file) toast('Foto cargada. Toca Guardar y sincronizar.');
    });

    if(url){
      url.setAttribute('placeholder','Enlace de imagen opcional');
      url.setAttribute('autocomplete','off');
    }
  }

  function enhanceEditor(){
    const root=document.getElementById('modalRoot');
    if(!root) return;
    const editor=root.querySelector('.product-editor');
    if(!editor) return;

    const imageBox=editor.querySelector('.image-upload-box-v83');
    if(imageBox && imageBox.dataset.sdcV129Box!=='1'){
      imageBox.dataset.sdcV129Box='1';
      const label=imageBox.querySelector(':scope > .label');
      if(label) label.textContent='Imágenes del producto';
      const hint=imageBox.querySelector('.hint');
      if(hint) hint.textContent='Foto principal arriba. Puedes tomar foto, elegir desde galería o pegar un enlace. Luego toca Guardar y sincronizar.';
      const add=imageBox.querySelector('#addImageRow');
      if(add) add.textContent='+ Agregar otra foto';
    }

    root.querySelectorAll('.image-row-v83').forEach((row,i)=>enhanceRow(row,i));
  }

  function boot(){
    ensureCss();
    ensureScripts();
    enhanceEditor();
    const root=document.getElementById('modalRoot');
    if(root){
      let scheduled=false;
      new MutationObserver(()=>{
        if(scheduled) return;
        scheduled=true;
        setTimeout(()=>{scheduled=false;ensureCss();ensureScripts();enhanceEditor();},100);
      }).observe(root,{childList:true,subtree:true});
    }
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();


;/* ==== js/sdc-v118-whatsapp-messages.js ==== */

/* SDC V128: WhatsApp estable. Sin MutationObserver infinito. */
(function(){
  'use strict';

  if(window.SDCV128WhatsAppStable) return;
  window.SDCV128WhatsAppStable = true;

  const BUSINESS='SD COMAYAGUA';
  const WA=' +504 3151-7755';

  function t(v){return String(v??'').replace(/\s+/g,' ').trim();}
  function text(sel,root=document){return t(root.querySelector(sel)?.textContent||'');}
  function val(sel,root=document){return t(root.querySelector(sel)?.value||'');}
  function moneyText(v){const raw=t(v); return raw?raw.replace(/Lps\.?\s*/i,'Lps. '):'Lps. 0';}
  function cleanPhone(v){const n=String(v||'').replace(/\D/g,''); if(!n)return ''; if(n.length===8)return '504'+n; if(n.length===11&&n.startsWith('504'))return n; return n;}
  function openWA(phone,msg){const num=cleanPhone(phone); const url=num?`https://wa.me/${num}?text=${encodeURIComponent(msg)}`:`https://wa.me/?text=${encodeURIComponent(msg)}`; window.open(url,'_blank','noopener');}
  function copy(msg){try{navigator.clipboard?.writeText(msg);}catch(e){}}
  function toast(msg){const el=document.getElementById('toast'); if(el){el.textContent=msg;el.classList.add('show');clearTimeout(el._v128);el._v128=setTimeout(()=>el.classList.remove('show'),2400);}}

  function isSaleModal(){return /venta|factura|recibo/i.test(text('.quote-head h3,#modalRoot .modal-head h3')+' '+text('.quote-status'));}
  function docKind(){return isSaleModal()?'recibo':'cotización';}
  function totalFromSummary(){const c=[...document.querySelectorAll('#totalsMini .summary-total b:last-child,.summary-total b:last-child,.grand b:last-child')].map(x=>t(x.textContent)).filter(Boolean); return moneyText(c[c.length-1]||'Lps. 0');}
  function summaryValue(label){const rows=[...document.querySelectorAll('#totalsMini .summary-row,.summary-row')]; const row=rows.find(r=>t(r.textContent).toLowerCase().includes(label.toLowerCase())); if(!row)return 'Lps. 0'; const bs=row.querySelectorAll('b'); return moneyText(t(bs[bs.length-1]?.textContent||''));}
  function getItems(){return [...document.querySelectorAll('#cartList .cart-row')].map(r=>{const name=t(r.querySelector('.cart-info b,b')?.textContent||'Producto'); const line=t(r.querySelector('.cart-info span,span')?.textContent||''); const qty=t(r.querySelector('.qtybox input')?.value||'1'); return {name,line,qty};}).filter(x=>x.name&&!/agrega productos/i.test(x.name));}
  function customerInfo(){return {client:val('[data-k="client"]')||'Cliente',phone:val('[data-k="phone"]'),dep:val('[data-k="department"]'),mun:val('[data-k="municipality"]'),ref:val('[data-k="reference"]'),type:val('[data-k="shippingType"]'),company:val('[data-k="company"]')};}
  function deliveryLabel(type){const v=t(type).toLowerCase(); if(v.includes('cod'))return 'Pagar al recibir'; if(v.includes('local'))return 'Envío local / por definir'; return 'Depósito o Tigo Money';}

  function buildDocMessage(){
    const sale=isSaleModal();
    const kind=sale?'RECIBO DE COMPRA':'COTIZACIÓN';
    const c=customerInfo();
    const items=getItems();
    const subtotal=summaryValue('Productos');
    const envio=summaryValue('Envío');
    const comision=summaryValue('Comisión');
    const total=totalFromSummary();
    const date=new Date().toLocaleString('es-HN',{day:'2-digit',month:'long',year:'numeric',hour:'numeric',minute:'2-digit'});
    const lines=[];
    lines.push(`*${kind} - ${BUSINESS}*`,'');
    lines.push(`Hola ${c.client||'cliente'}, le compartimos el detalle ${sale?'de su compra':'de su cotización'}:`,'');
    lines.push('*Productos:*');
    if(items.length){items.forEach((it,i)=>{lines.push(`${i+1}. ${it.name}`);lines.push(`   Cantidad: ${it.qty}`);if(it.line)lines.push(`   ${it.line}`);});}
    else lines.push('1. Producto pendiente de confirmar');
    lines.push('','*Resumen:*',`Subtotal productos: ${subtotal}`,`Envío: ${envio}`);
    if(!/0$/.test(comision)) lines.push(`Comisión: ${comision}`);
    lines.push(`*TOTAL A PAGAR: ${total}*`,'','*Entrega / pago:*',`Modalidad: ${deliveryLabel(c.type)}`);
    if(c.company) lines.push(`Empresa o entrega: ${c.company}`);
    if(c.dep||c.mun) lines.push(`Ubicación: ${[c.dep,c.mun].filter(Boolean).join(' / ')}`);
    if(c.ref) lines.push(`Referencia: ${c.ref}`);
    lines.push('');
    if(sale){lines.push('✅ Su pedido queda registrado con los datos anteriores.','Por favor confirme que nombre, teléfono, ubicación y forma de entrega están correctos.');}
    else{lines.push('✅ Esta cotización está sujeta a disponibilidad de inventario.','Para reservar o facturar, confirme por este medio.');}
    lines.push('',`Fecha: ${date}`,BUSINESS,`WhatsApp:${WA}`);
    return lines.join('\n');
  }

  function buildProductMessage(){
    const root=document.getElementById('modalRoot')||document;
    const title=text('h2,h3',root)||text('.product-title',root)||'Producto SD Comayagua';
    const price=[...root.querySelectorAll('b,strong,span')].map(x=>t(x.textContent)).find(x=>/Lps\.?/i.test(x))||'';
    const desc=text('.product-description,.product-detail p,p',root);
    return [`*PRODUCTO - ${BUSINESS}*`,'',`Producto: ${title}`,price?`Precio: ${moneyText(price)}`:'Precio: por confirmar',desc?`Descripción: ${desc}`:'','','Opciones de entrega:','• Depósito / Tigo Money','• Pagar al recibir','• Envío local según zona','','✅ Precio sujeto a disponibilidad.',BUSINESS,`WhatsApp:${WA}`].filter(Boolean).join('\n');
  }

  function intercept(){
    document.addEventListener('click',ev=>{
      const wa=null; // v306: no interceptar #waText; lo maneja bindQuoteCommon con el documento real.
      if(wa){return;}
      const prod=ev.target.closest('#v53WhatsAppProduct,[data-action="sendProductWhatsApp"]');
      if(prod){ev.preventDefault();ev.stopImmediatePropagation();const phone=prompt('Número WhatsApp del cliente. Déjelo vacío para elegir el chat manualmente:',''); if(phone===null)return; const msg=buildProductMessage();copy(msg);openWA(phone,msg);toast('Mensaje de producto copiado y WhatsApp abierto.');}
    },true);
  }

  function setText(id,label){
    const el=document.getElementById(id);
    if(!el) return;
    if(t(el.textContent)===label) return;
    el.textContent=label;
  }
  function renameButtons(){
    setText('waText','Enviar WhatsApp');
    setText('downloadDoc','Descargar imagen');
    setText('shortReceipt','Recibo corto');
    const finish=document.getElementById('finishSale');
    if(finish && !/guardar|finalizar/i.test(finish.textContent)) finish.textContent='Finalizar venta';
  }

  function boot(){
    intercept();
    renameButtons();
    // Observador liviano y limitado: NO modifica HTML si no hace falta.
    const root=document.getElementById('modalRoot');
    if(root){
      let scheduled=false;
      new MutationObserver(()=>{
        if(scheduled) return;
        scheduled=true;
        setTimeout(()=>{scheduled=false;renameButtons();},80);
      }).observe(root,{childList:true,subtree:true});
    }
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true}); else boot();
})();


;/* ==== js/sdc-v229-scroll-final.js ==== */

/* SD Comayagua v229 · Scroll Final */
(function(){
  'use strict';

  function mobile(){
    try{return matchMedia('(max-width:760px)').matches;}catch(e){return innerWidth<=760;}
  }

  function setImp(el,prop,value){
    if(!el || !el.style) return;
    try{el.style.setProperty(prop,value,'important');}catch(e){}
  }

  function apply(){
    if(!mobile()) return;
    const modal=document.querySelector('#modalRoot .modal.quote-modal-v176, #modalRoot .modal.product-detail-modal-v221');
    if(!modal) return;

    const backdrop=modal.closest('.modal-backdrop');
    const isQuote=modal.classList.contains('quote-modal-v176');
    const body=isQuote ? modal.querySelector(':scope > .quote-body-v176') : modal.querySelector(':scope > .modal-body');
    const head=isQuote ? modal.querySelector(':scope > .quote-head-v176') : modal.querySelector(':scope > .modal-head');

    modal.classList.add('sdc-v229-scroll-modal');
    if(backdrop) backdrop.classList.add('sdc-v229-scroll-backdrop');

    setImp(document.documentElement,'overflow','hidden');
    setImp(document.documentElement,'height','100dvh');
    setImp(document.body,'overflow','hidden');
    setImp(document.body,'height','100dvh');

    const root=document.querySelector('#modalRoot');
    if(root){
      setImp(root,'position','fixed');
      setImp(root,'inset','0');
      setImp(root,'z-index','99999');
      setImp(root,'width','100vw');
      setImp(root,'height','100dvh');
      setImp(root,'overflow','hidden');
    }

    if(backdrop){
      setImp(backdrop,'position','fixed');
      setImp(backdrop,'inset','0');
      setImp(backdrop,'display','flex');
      setImp(backdrop,'align-items','flex-start');
      setImp(backdrop,'justify-content','center');
      setImp(backdrop,'width','100vw');
      setImp(backdrop,'height','100dvh');
      setImp(backdrop,'max-height','100dvh');
      setImp(backdrop,'overflow','hidden');
      setImp(backdrop,'padding','7px');
      setImp(backdrop,'touch-action','none');
    }

    setImp(modal,'position','relative');
    setImp(modal,'display','flex');
    setImp(modal,'flex-direction','column');
    setImp(modal,'width','min(calc(100vw - 14px),540px)');
    setImp(modal,'max-width','min(calc(100vw - 14px),540px)');
    setImp(modal,'height','auto');
    setImp(modal,'min-height','0');
    setImp(modal,'max-height','calc(100dvh - 14px)');
    setImp(modal,'overflow','hidden');
    setImp(modal,'margin','0 auto');
    setImp(modal,'transform','none');
    setImp(modal,'touch-action','auto');

    if(head){
      setImp(head,'position','relative');
      setImp(head,'top','auto');
      setImp(head,'flex','0 0 auto');
      setImp(head,'z-index','3');
    }

    if(body){
      setImp(body,'flex','1 1 auto');
      setImp(body,'display','block');
      setImp(body,'min-height','0');
      setImp(body,'height','auto');
      setImp(body,'max-height','none');
      setImp(body,'overflow-y','auto');
      setImp(body,'overflow-x','hidden');
      setImp(body,'-webkit-overflow-scrolling','touch');
      setImp(body,'overscroll-behavior','contain');
      setImp(body,'touch-action','pan-y pinch-zoom');
      setImp(body,'padding-bottom','28px');
    }

    if(isQuote){
      modal.querySelectorAll('.picker-list,.picker-list-v200,.cart-list,.gift-list-v176,.gift-picker-list,#docPreview').forEach(el=>{
        setImp(el,'max-height','none');
        setImp(el,'height','auto');
        setImp(el,'overflow','visible');
        setImp(el,'touch-action','pan-y pinch-zoom');
      });
      modal.querySelectorAll('.quote-category-list-v201').forEach(el=>{
        if(el.classList.contains('is-open')){
          setImp(el,'display','grid');
          setImp(el,'max-height','none');
          setImp(el,'overflow','visible');
        }else{
          setImp(el,'display','none');
        }
      });
    }else{
      modal.querySelectorAll('.v141-detail-shell,.v163-detail-shell,.v49-tab,.v141-tabpanel,.v163-tabpanel').forEach(el=>{
        setImp(el,'max-height','none');
        setImp(el,'overflow','visible');
        setImp(el,'touch-action','pan-y pinch-zoom');
      });
    }

    modal.querySelectorAll('.sdc210-smart-cart,.sdc210-step-controls,.quote-actions-v176,.modal-actions,.v141-detail-actions,.v163-detail-actions,.v49-detail-actions').forEach(el=>{
      setImp(el,'position','static');
      setImp(el,'bottom','auto');
      setImp(el,'top','auto');
      setImp(el,'left','auto');
      setImp(el,'right','auto');
      setImp(el,'transform','none');
    });
  }

  function scrollBodyTop(){
    const modal=document.querySelector('#modalRoot .modal.quote-modal-v176, #modalRoot .modal.product-detail-modal-v221');
    if(!modal) return;
    const body=modal.classList.contains('quote-modal-v176') ? modal.querySelector(':scope > .quote-body-v176') : modal.querySelector(':scope > .modal-body');
    if(body){
      try{body.scrollTo({top:0,behavior:'smooth'});}catch(e){body.scrollTop=0;}
    }
  }

  function boot(){
    apply();
    document.addEventListener('click',function(ev){
      if(ev.target && ev.target.closest && ev.target.closest('[data-sdc210-step],[data-sdc210-prev],[data-sdc210-next]')){
        setTimeout(function(){apply(); scrollBodyTop();},80);
      }else{
        setTimeout(apply,50);
      }
    },true);
    ['touchstart','pointerdown','wheel','resize','orientationchange'].forEach(type=>{
      window.addEventListener(type,function(){requestAnimationFrame(apply);},{passive:true,capture:true});
    });
    new MutationObserver(function(){requestAnimationFrame(apply);}).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class','style']});
    setInterval(apply,500);
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();


;/* ==== js/sdc-v230-short-receipt-both.js ==== */

/* SD Comayagua · v230 */
(function(){
  'use strict';

  function toast(msg){
    try{
      if(window.SDCApp && typeof window.SDCApp.toast==='function') return window.SDCApp.toast(msg);
    }catch(e){}
    try{
      const t=document.getElementById('toast');
      if(t){ t.textContent=msg; t.classList.add('show'); setTimeout(()=>t.classList.remove('show'),2600); }
    }catch(e){}
  }

  function moneyNumber(text){
    const raw=String(text||'').replace(/,/g,'');
    const m=raw.match(/Lps\.\s*([0-9]+(?:\.[0-9]{1,2})?)/i) || raw.match(/([0-9]+(?:\.[0-9]{1,2})?)/);
    return m?Number(m[1]):0;
  }

  function receiptTotal(section){
    const el=section.querySelector('.sdc204-total b,.sdc205-total b,.short-line.grand b,.sdc208-line.grand b,.sdc208-total b,.sdc208-grand b,.receipt-total b');
    return moneyNumber(el ? el.textContent : '0');
  }

  function waitHtml2Canvas(timeout){
    timeout=timeout||12000;
    if(window.html2canvas) return Promise.resolve(window.html2canvas);
    var clean='https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
    var script=[].slice.call(document.scripts).find(function(s){return String(s.src||'').indexOf('html2canvas')>-1;});
    if(!script){
      script=document.createElement('script');
      script.src=clean;
      script.async=true;
      script.defer=true;
      script.dataset.sdcLazyLib='1';
      document.head.appendChild(script);
    }
    const start=Date.now();
    return new Promise((resolve,reject)=>{
      const tick=()=>{
        if(window.html2canvas) return resolve(window.html2canvas);
        if(Date.now()-start>timeout) return reject(new Error('html2canvas no cargó'));
        setTimeout(tick,120);
      };
      script.addEventListener('error',()=>reject(new Error('html2canvas no cargó')),{once:true});
      tick();
    });
  }

  function downloadCanvas(canvas, filename){
    const a=document.createElement('a');
    a.href=canvas.toDataURL('image/png');
    a.download=filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  function buildCompareExport(modal){
    const sections=[...modal.querySelectorAll('.short-receipt-variant-v147')];
    if(sections.length<2) throw new Error('No se encontraron las dos variantes del recibo.');
    const left=sections[0].querySelector('.short-receipt,.sdc-short-v204,.sdc-short-v205,.sdc-short-v206');
    const right=sections[1].querySelector('.short-receipt,.sdc-short-v204,.sdc-short-v205,.sdc-short-v206');
    if(!left || !right) throw new Error('No se pudieron preparar los recibos.');

    const normalTotal=receiptTotal(sections[0]);
    const codTotal=receiptTotal(sections[1]);
    const savings=Math.max(0,codTotal-normalTotal);

    const host=document.createElement('div');
    host.className='sdc230-compare-export-host';
    host.style.cssText='position:fixed;left:-20000px;top:0;z-index:-1;opacity:1;pointer-events:none;display:inline-block;width:max-content;';
    host.innerHTML=''
      + '<div class="sdc230-compare-export sdc230-compare-export-flyer">'
      + '  <div class="sdc230-compare-head">'
      + '    <div>'
      + '      <span>SD COMAYAGUA</span>'
      + '      <h2>Comparativa de pago</h2>'
      + '      <p>Mira cuánto pagará el cliente según el tipo de entrega y cuánto se ahorra si deposita antes.</p>'
      + '    </div>'
      + '    <div class="sdc230-compare-pill">'
      + '      <b>Ahorro por depósito: Lps. ' + Math.round(savings) + '</b>'
      + '      <small>Envío normal: Lps. ' + Math.round(normalTotal) + ' · Pagar al recibir: Lps. ' + Math.round(codTotal) + '</small>'
      + '    </div>'
      + '  </div>'
      + '  <div class="sdc230-compare-grid">'
      + '    <section class="sdc230-compare-card"><div class="sdc230-compare-label normal">Envío normal / depósito antes</div></section>'
      + '    <section class="sdc230-compare-card"><div class="sdc230-compare-label cod">Pagar al recibir</div></section>'
      + '  </div>'
      + '  <div class="sdc230-compare-foot">Comparativa lista para compartir por WhatsApp</div>'
      + '</div>';
    const cards=host.querySelectorAll('.sdc230-compare-card');
    cards[0].appendChild(left.cloneNode(true));
    cards[1].appendChild(right.cloneNode(true));
    document.body.appendChild(host);
    return host;
  }

  async function exportBoth(modal){
    const btn=modal.querySelector('#downloadShortBoth');
    if(btn && btn.dataset.busy==='1') return;
    if(btn){ btn.dataset.busy='1'; btn.disabled=true; }
    try{
      await waitHtml2Canvas();
      const host=buildCompareExport(modal);
      await new Promise(r=>setTimeout(r,180));
      const target=host.firstElementChild;
      const rect=target.getBoundingClientRect();
      const safeWidth=Math.ceil(Math.max(target.scrollWidth, rect.width))+24;
      const safeHeight=Math.ceil(Math.max(target.scrollHeight, rect.height))+24;
      const canvas=await window.html2canvas(target, {
        backgroundColor:'#eef6ff',
        scale:(/Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent||'')?1.45:2),
        useCORS:true,
        allowTaint:true,
        logging:false,
        width:safeWidth,
        height:safeHeight,
        windowWidth:safeWidth,
        windowHeight:safeHeight,
        x:0,
        y:0,
        scrollX:0,
        scrollY:0
      });
      const stamp=new Date();
      const pad=n=>String(n).padStart(2,'0');
      const filename='recibo-comparativo-'+stamp.getFullYear()+pad(stamp.getMonth()+1)+pad(stamp.getDate())+'-'+pad(stamp.getHours())+pad(stamp.getMinutes())+'.png';
      downloadCanvas(canvas, filename);
      host.remove();
      toast('Imagen comparativa descargada.');
    }catch(err){
      console.error(err);
      toast('No se pudo descargar la imagen comparativa.');
    }finally{
      if(btn){ btn.dataset.busy='0'; btn.disabled=false; }
    }
  }

  function enhanceShortReceiptModal(modal){
    if(!modal || modal.dataset.sdc230ShortReady==='1') return;
    const body=modal.querySelector('.short-receipt-screen-v147');
    const actions=modal.querySelector('.short-receipt-actions');
    if(!body || !actions) return;
    modal.dataset.sdc230ShortReady='1';

    if(!actions.querySelector('#downloadShortBoth')){
      const both=document.createElement('button');
      both.type='button';
      both.id='downloadShortBoth';
      both.className='btn sdc230-short-both';
      both.textContent='Descargar ambos';
      actions.appendChild(both);
      both.addEventListener('click', function(){ exportBoth(modal); });
    }
  }

  function refresh(){
    document.querySelectorAll('#modalRoot .modal').forEach(modal=>{
      const title=modal.querySelector('.modal-head h3');
      if(title && /factura corta comercial/i.test(title.textContent||'')){
        enhanceShortReceiptModal(modal);
      }
    });
  }

  function boot(){
    refresh();
    const obs=new MutationObserver(()=>refresh());
    obs.observe(document.body,{childList:true,subtree:true});
    document.addEventListener('click',()=>setTimeout(refresh,80),true);
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', boot, {once:true});
  else boot();
})();


;/* ==== js/sdc-v231-quality.js ==== */

/* SD Comayagua · v231 Quality helpers */
(function(){
  'use strict';

  function setViewportUnit(){
    try{ document.documentElement.style.setProperty('--sdc231-vh', (window.innerHeight * 0.01) + 'px'); }catch(err){}
  }

  function cleanDuplicatedHomeText(){
    document.querySelectorAll('.sdc209-welcome').forEach(box=>{
      const seen=new Set();
      box.querySelectorAll('small').forEach(el=>{
        const text=(el.textContent||'').trim().toLowerCase();
        if(!text) return;
        if(seen.has(text)) el.remove();
        else seen.add(text);
      });
    });
  }

  function improveClickableCards(){
    document.querySelectorAll('article.product-card[data-id]').forEach(card=>{
      if(!card.hasAttribute('tabindex')) card.setAttribute('tabindex','0');
      if(!card.hasAttribute('role')) card.setAttribute('role','button');
      const name=(card.dataset.productName || card.querySelector('h3')?.textContent || '').trim();
      if(name && !card.getAttribute('aria-label')) card.setAttribute('aria-label','Abrir detalle de '+name);
    });
  }

  function routeFromHash(){
    const hash=(location.hash||'').replace('#','').trim().toLowerCase();
    const map={inicio:'inicio',home:'inicio',panel:'panel',productos:'productos',producto:'productos',catalogo:'productos','catálogo':'productos'};
    if(map[hash] && typeof window.SDCSetPageV150==='function'){
      try{ window.SDCSetPageV150(map[hash]); }catch(err){}
    }
  }

  function markScrollableModals(){
    const root=document.getElementById('modalRoot');
    if(!root) return;
    root.querySelectorAll('.modal-backdrop').forEach(x=>x.classList.add('sdc-v231-backdrop'));
    root.querySelectorAll('.modal').forEach(x=>x.classList.add('sdc-v231-modal'));
  }

  function polish(){
    document.body.classList.add('sdc-v231-quality');
    cleanDuplicatedHomeText();
    improveClickableCards();
    markScrollableModals();
  }

  setViewportUnit();
  window.addEventListener('resize', setViewportUnit, {passive:true});
  window.addEventListener('orientationchange', setViewportUnit, {passive:true});
  window.addEventListener('hashchange', routeFromHash, {passive:true});

  document.addEventListener('DOMContentLoaded', function(){
    polish();
    routeFromHash();
    const app=document.getElementById('app') || document.body;
    try{
      new MutationObserver(function(){ polish(); }).observe(app,{childList:true,subtree:true});
    }catch(err){}
  });
})();


;/* ==== js/sdc-v232-category-clean.js ==== */

/* SD Comayagua · v232
   Al elegir una categoría desde el botón CATEGORÍA, muestra Catálogo/Productos
   y no deja visible el Panel privado de inversión. */
(function(){
  'use strict';

  function goProducts(delay){
    window.setTimeout(function(){
      try{
        localStorage.setItem('sdc_v150_page','productos');
        localStorage.setItem('sdc_v97_page','productos');
      }catch(err){}
      if(typeof window.SDCSetPageV150 === 'function'){
        try{ window.SDCSetPageV150('productos'); return; }catch(err){}
      }
      if(document.body) document.body.dataset.sdcPageV150='productos';
    }, delay || 0);
  }

  document.addEventListener('click', function(ev){
    const target = ev.target && ev.target.closest ? ev.target.closest('[data-catpick-v191],[data-catcard],[data-action="categoryQuick"]') : null;
    if(!target) return;
    goProducts(80);
  }, true);

  document.addEventListener('change', function(ev){
    const el = ev.target;
    if(!el) return;
    if(el.id === 'categorySelect' || el.id === 'inventoryCategorySelect'){
      goProducts(40);
    }
  }, true);

  // Si el usuario entra con #productos o desde categorias.html, forzar catálogo limpio.
  function routeHash(){
    const h=(location.hash||'').toLowerCase();
    if(h==='#productos' || h==='#catalogo' || h==='#categorias') goProducts(10);
  }
  window.addEventListener('hashchange', routeHash, {passive:true});
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', routeHash, {once:true});
  else routeHash();
})();


;/* ==== js/sdc-v233-mobile-retouch.js ==== */

/* SD Comayagua · v233 Mobile Retouch helpers */
(function(){
  'use strict';
  function addClass(){
    if(document.body) document.body.classList.add('sdc-v233-retouch');
  }
  function fixViewport(){
    try{ document.documentElement.style.setProperty('--sdc233-vh',(window.innerHeight*0.01)+'px'); }catch(e){}
  }
  function keepProductsHash(){
    const h=(location.hash||'').toLowerCase();
    if((h==='#productos'||h==='#catalogo'||h==='#categorias') && typeof window.SDCSetPageV150==='function'){
      try{ window.SDCSetPageV150('productos'); }catch(e){}
    }
  }
  addClass();
  fixViewport();
  window.addEventListener('resize',fixViewport,{passive:true});
  window.addEventListener('orientationchange',fixViewport,{passive:true});
  window.addEventListener('hashchange',keepProductsHash,{passive:true});
  document.addEventListener('DOMContentLoaded',function(){
    addClass();
    keepProductsHash();
    const app=document.getElementById('app')||document.body;
    try{ new MutationObserver(addClass).observe(app,{childList:true,subtree:true}); }catch(e){}
  });
})();


;/* ==== js/sdc-v235-unified-polish.js ==== */

document.documentElement.dataset.sdcV235='1';


;/* ==== js/sdc-v236-mobile-app-compact.js ==== */

document.documentElement.dataset.sdcV236='1';


;/* ==== js/sdc-v237-mobile-polish.js ==== */

document.documentElement.dataset.sdcV237='1';


;/* ==== js/sdc-v238-category-visible.js ==== */

document.documentElement.dataset.sdcV238='1';


;/* ==== js/sdc-v239-mobile-category-clean.js ==== */

document.documentElement.dataset.sdcV239='1';


;/* ==== js/sdc-v240-mobile-category-refine.js ==== */

document.documentElement.dataset.sdcV240='1';


;/* ==== js/sdc-v241-category-share-premium.js ==== */

document.documentElement.dataset.sdcV241='1';


;/* ==== js/sdc-v242-quote-receipt-fixes.js ==== */

document.documentElement.dataset.sdcV242='1';


;/* ==== js/sdc-v245-delivery-toggle.js ==== */

document.documentElement.dataset.sdcV245='1';


;/* ==== js/sdc-v246-product-delivery-polish.js ==== */

document.documentElement.dataset.sdcV246='1';


;/* ==== js/sdc-v247-product-delivery-fix.js ==== */

document.documentElement.dataset.sdcV247='1';


;/* ==== js/sdc-v248-mobile-premium.js ==== */

document.documentElement.dataset.sdcV248='1';


;/* ==== js/sdc-v249-mobile-catalog-app.js ==== */

document.documentElement.dataset.sdcV249='1';


;/* ==== js/sdc-v250-detail-quote-polish.js ==== */

document.documentElement.dataset.sdcV250='1';


;/* ==== js/sdc-v251-store-professional.js ==== */

document.documentElement.dataset.sdcV251='1';


;/* ==== js/sdc-v252-receipt-clean.js ==== */

document.documentElement.dataset.sdcV252='1';


;/* ==== js/sdc-v253-compare-fit.js ==== */

document.documentElement.dataset.sdcV253='1';


;/* ==== js/sdc-v254-compare-flyer.js ==== */

document.documentElement.dataset.sdcV254='1';


;/* ==== js/sdc-v255-compare-square.js ==== */

document.documentElement.dataset.sdcV255='1';


;/* ==== js/sdc-v256-compare-autoheight.js ==== */

document.documentElement.dataset.sdcV256='1';


;/* ==== js/sdc-v257-stock-fix.js ==== */

document.documentElement.dataset.sdcV257='stable-share-v305-optimized';
(function(){
  console.info('SDC v305: modo estable optimizado activo; estilos y botones ya están en el bundle.');
})();


;/* ==== js/sdc-v236-pro-max.js ==== */

document.documentElement.dataset.sdcV236='1';
window.__sdcV296StructureFix=true;
window.addEventListener('click',e=>{if(e.target.closest('[data-catcapture-v199]'))setTimeout(()=>document.querySelector('[data-action="categoriesSheet"]')?.click(),900)},true);

(function(){
  if(window.__sdcV301CopyButtons) return;
  window.__sdcV301CopyButtons=true;

  function clean(s){return String(s||'').replace(/\s+/g,' ').trim();}
  function money(s){const m=clean(s).match(/Lps\.?\s*\d+(?:[.,]\d+)?/i);return m?m[0].replace('Lps','Lps.'):'';}
  function codeFrom(root){
    const t=clean(root.textContent);
    const parts=t.match(/[A-Z]{2,}[A-Z0-9-]{2,}|SDC-\d+/g)||[];
    return parts.find(x=>/^SDC-/.test(x))||parts[parts.length-1]||'';
  }
  function productData(root){
    const title=clean(root.querySelector('h1,h2,h3,.modal-title')?.textContent)||'Producto SD Comayagua';
    const text=clean(root.textContent);
    const price=money(text)||'Consultar precio';
    const code=codeFrom(root)||'Consultar código';
    const cat=(text.match(/Dedales|Audio|Controles|Coolers|Accesorios|Adaptador MicroSD|Cables/i)||['Producto'])[0];
    const colors=[];
    root.querySelectorAll('button,span,em,b,strong,small').forEach(el=>{
      const v=clean(el.textContent);
      if(/^(Azul|Rojo|Negro|General|Gris|Blanco|Verde|Rosado|Dorado)\b/i.test(v) && v.length<30) colors.push(v);
    });
    const unique=[...new Set(colors)].slice(0,6).join(', ');
    return {title,price,code,cat,colors:unique};
  }
  function waText(d){
    return `✨ *${d.title}*\n\n💵 Precio: *${d.price}*\n🏷️ Categoría: ${d.cat}\n🔖 Código: ${d.code}${d.colors?`\n🎨 Disponible: ${d.colors}`:''}\n\n✅ Producto disponible en SD Comayagua.\n📲 WhatsApp: +504 3151-7755`;
  }
  function mpText(d){
    return `Título: ${d.title}\n\nPrecio: ${d.price}\nCondición: Nuevo\nCategoría: ${d.cat}\nUbicación: Comayagua, Honduras\nCódigo: ${d.code}${d.colors?`\nColores/disponibilidad: ${d.colors}`:''}\n\nDescripción:\nProducto disponible en SD Comayagua. Consulte disponibilidad antes de cerrar compra. Envíos a domicilio según zona. Pago por depósito/Tigo Money o pagar al recibir donde aplique.\n\nContacto: +504 3151-7755`;
  }
  async function copy(txt,msg){
    try{await navigator.clipboard.writeText(txt);toast(msg);}catch(e){prompt('Copie el texto:',txt);}
  }
  function toast(msg){
    const old=document.querySelector('.sdc-v297-mini-toast');if(old)old.remove();
    const el=document.createElement('div');el.className='sdc-v297-mini-toast';el.textContent=msg;document.body.appendChild(el);
    setTimeout(()=>el.remove(),2200);
  }
  function findDetail(){
    const root=document.querySelector('#modalRoot');
    if(!root) return null;
    const modal=root.querySelector('.product-detail-modal-v221,.modal');
    if(!modal) return null;
    const t=clean(modal.textContent);
    if(!/Añadir venta|Añadir cotización|WhatsApp|Colores|Cantidad/i.test(t)) return null;
    return modal;
  }
  function addPanel(){
    const modal=findDetail();
    if(!modal||modal.querySelector('.sdc-v297-copy-panel')) return;
    const actions=modal.querySelector('.v163-detail-actions,.modal-actions,.product-actions-v235')||modal.querySelector('.modal-body');
    if(!actions) return;
    const panel=document.createElement('section');
    panel.className='sdc-v297-copy-panel';
    panel.innerHTML='<div class="sdc-v297-copy-head"><div><b>Copiar publicación</b><span>Texto listo para WhatsApp o Facebook Marketplace.</span></div><i>📋</i></div><div class="sdc-v297-copy-actions"><button class="sdc-v297-copy-wa" type="button">Copiar WhatsApp</button><button class="sdc-v297-copy-mp" type="button">Copiar Facebook Marketplace</button></div>';
    panel.querySelector('.sdc-v297-copy-wa').addEventListener('click',()=>copy(waText(productData(modal)),'Texto para WhatsApp copiado'));
    panel.querySelector('.sdc-v297-copy-mp').addEventListener('click',()=>copy(mpText(productData(modal)),'Texto para Marketplace copiado'));
    actions.insertAdjacentElement('afterend',panel);
  }
  new MutationObserver(()=>setTimeout(addPanel,80)).observe(document.documentElement,{childList:true,subtree:true});
  document.addEventListener('click',()=>setTimeout(addPanel,140),true);
  window.addEventListener('load',addPanel);
  setInterval(addPanel,1200);
})();


;/* ==== js/sdc-v302-share-safe.js ==== */

/* SDC v302 share safe */
(function(){
 if(window.SDCV302ShareSafeReady)return;window.SDCV302ShareSafeReady=true;
 const PHONE='3151-7775',WA='50431517775';
 const q=s=>document.querySelector(s),c=v=>String(v||'').trim(),m=n=>'Lps. '+Math.round(Number(n||0)).toLocaleString('es-HN');
 function all(){try{return (window.SDCStore&&SDCStore.load().products)||[]}catch(e){return[]}}
 function nm(p){return c(p.name||p.nombre||'Producto')}
 function pr(p){return Number(p.price||p.precio||p.precio_venta||0)||0}
 function st(p){let r=Array.isArray(p.colors)?p.colors:(Array.isArray(p.colores)?p.colores:[]);return r.length?r.reduce((a,x)=>a+(Number(x.qty||x.cantidad||x.stock||0)||0),0):Math.max(0,Number(p.stock||p.existencia||0)||0)}
 function ca(p){return c(String(p.categories||p.category||p.categoria||'General').split(/[,;|/]/)[0])||'General'}
 function ds(p){return c(p.description||p.descripcion)||nm(p)+' disponible en SD Comayagua. Producto nuevo, listo para entrega segun zona. Precio y disponibilidad sujetos a confirmacion.'}
 function norm(x){return c(x).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase()}
 function code(p){
   let saved=c(p.codigo_producto||p.codigoProducto||p.productCode||p.sku||p.code||p.codigo);
   if(/^(SD|SDC)-/i.test(saved))return saved.toUpperCase();
   let n=norm(nm(p)),b='';
   if(/DEDAL/.test(n)&&/(V1|VERSION 1)/.test(n))b='DGV1';
   else if(/DEDAL/.test(n)&&/(V2|VERSION 2)/.test(n))b='DGV2';
   else{
     b=(n.match(/[A-Z0-9]+/g)||[]).filter(x=>!['DE','DEL','LA','EL','LOS','LAS','PARA','CON','Y','EN','POR','UN','UNA'].includes(x)).map(x=>/^V?\d+$/.test(x)?(x[0]=='V'?x:'V'+x):(/[0-9]/.test(x)&&x.length<6?x:x[0])).join('').slice(0,8)||'PROD';
   }
   return 'SD-'+b+'-'+Math.round(pr(p));
 }
 function unit(p){let n=norm(nm(p)+' '+ca(p));return /DEDAL|GATILLO/.test(n)?'par':'unidad'}
 function plural(u){return u==='par'?'pares':u+'s'}
 function cur(){let r=q('#modalRoot .product-detail-modal-v221,#modalRoot .v49-product-detail,#modalRoot .v141-product-detail,#modalRoot .v163-product-detail');if(!r)return null;let t=c((r.querySelector('.v49-detail-main h4,.v141-head-copy h3,.v163-detail-main h4,h3,h4')||{}).textContent||''),id=c((r.querySelector('.v141-meta-grid article:nth-child(3) b,.v49-detail-main small,.v163-detail-main small')||{}).textContent||'').split('·').pop();return all().find(p=>c(p.id||p.codigo).toLowerCase()===id.toLowerCase())||all().find(p=>nm(p).toLowerCase()===t.toLowerCase())||null}
 function buy(p){return 'Hola SD COMAYAGUA 👋 quiero comprar '+nm(p)+'. ¿Me confirma disponibilidad y opciones de entrega?'}
 function link(p){return 'https://wa.me/'+WA+'?text='+encodeURIComponent(buy(p))}
 function wa(p){return '🎮 '+nm(p)+'\n\n'+ds(p)+'\n\n✅ Precio: '+m(pr(p))+'\n✅ Categoria: '+ca(p)+'\n✅ Codigo: '+code(p)+'\n✅ Inventario disponible: '+st(p)+'\n\n📍 Disponible en Comayagua\n📲 WhatsApp: +504 '+PHONE+'\n💬 Pedir por WhatsApp:\n'+link(p)}
 function fb(p){return '🛒 PUBLICACION PARA FACEBOOK\n\n📌 Titulo: '+nm(p)+'\n💵 Precio: '+m(pr(p))+'\n🔖 Codigo: '+code(p)+'\n🏷️ Categoria: '+ca(p)+'\n📦 Disponible: '+st(p)+'\n\n📝 Descripcion:\n'+ds(p)+'\n\n📍 Comayagua, Honduras\n📲 WhatsApp: +504 '+PHONE}
 function ia(p){
   let s=st(p),u=unit(p),us=s===1?u:plural(u),cod=code(p),available=s>0;
   let regla=available?'Si el cliente pide '+s+' '+us+' o menos, puede continuar con la cotizacion.\n\nSi el cliente pide mas de '+s+' '+us+', la IA NO debe confirmar esa cantidad. Debe responder:\n\n“Por el momento solo tengo disponible '+s+' '+us+' de '+nm(p)+' 😅 ¿Desea llevar esa cantidad o prefiere que le muestre otra opcion similar? 👀”':'Este producto esta agotado. Si el cliente pregunta por este producto, la IA debe responder:\n\n“Por el momento '+nm(p)+' esta agotado 😔 ¿Desea que le muestre otra opcion similar disponible? 👀”';
   return 'NOMBRE DEL PRODUCTO\n'+nm(p)+'\n\nPRECIO\n'+Math.round(pr(p))+'\n\nDETALLES DEL PRODUCTO\n\n🎮 '+nm(p)+'\n\n'+ds(p)+'\n\n✅ Precio: '+m(pr(p))+' cada '+u+'\n✅ Categoria: '+ca(p)+'\n✅ Codigo del producto: '+cod+'\n✅ Inventario disponible: '+s+' '+us+'\n✅ Producto nuevo y listo para entrega\n✅ Precio sujeto a disponibilidad\n✅ Consultar entrega segun zona\n\n📍 Disponible en Comayagua\n📲 WhatsApp: +504 '+PHONE+'\nConsulta disponibilidad.\n\n💬 PEDIR POR WHATSAPP:\n'+link(p)+'\n\n'+cod+'\n\n📦 INVENTARIO PARA LA IA\n\nInventario disponible: '+s+' '+us+'\nEstado: '+(available?'✅ Disponible':'❌ Agotado')+'\n\nRegla de cantidad:\nAntes de cotizar o confirmar este producto, la IA debe comparar la cantidad que pide el cliente con el inventario disponible.\n\n'+regla+'\n\nSi el inventario disponible llega a 0, este producto queda agotado y la IA no debe ofrecerlo, cotizarlo ni confirmar pedidos de este producto.\n\nLa IA no debe inventar disponibilidad ni confirmar mas cantidad de la que aparece en inventario.\n\nIMPORTANTE: cada vez que vendas unidades, actualiza la cantidad del inventario en esta ficha para que la IA responda con la disponibilidad correcta.'
 }
 function toast(x){let e=document.createElement('div');e.textContent=x;e.style.cssText='position:fixed;left:50%;bottom:22px;transform:translateX(-50%);z-index:999999;background:#071a35;color:white;padding:12px 16px;border-radius:999px;font-weight:900';document.body.appendChild(e);setTimeout(()=>e.remove(),1700)}
 function manual(t){prompt('Copie el texto:',t)}
 function cp(t,l){let a=document.createElement('textarea');a.value=t;a.setAttribute('readonly','');a.style.cssText='position:fixed;top:-1000px;left:-1000px;opacity:0';document.body.appendChild(a);a.focus();a.select();a.setSelectionRange(0,a.value.length);let ok=false;try{ok=document.execCommand('copy')}catch(e){}a.remove();if(ok)return toast(l+' copiado ✅');if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(t).then(()=>toast(l+' copiado ✅')).catch(()=>manual(t))}else manual(t)}
 function add(){let r=q('#modalRoot .product-detail-modal-v221,#modalRoot .v49-product-detail,#modalRoot .v141-product-detail,#modalRoot .v163-product-detail');if(!r||r.querySelector('.sdc302box'))return;let h=r.querySelector('[data-panel="cliente"]')||r.querySelector('.v141-detail-shell')||r;let d=document.createElement('section');d.className='sdc302box';d.style.cssText='margin:14px 0;padding:14px;border-radius:20px;background:#f4f8ff;border:1px solid #d9e8f8';d.innerHTML='<b>Compartir producto</b><p style="margin:7px 0 0;color:#64748b;font-size:12px">Textos listos para publicar y para entrenar la IA por articulo.</p><div style="display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-top:10px"><button class="sdc302wa" type="button" style="border:0;border-radius:16px;min-height:54px;background:#25d366;color:white;font-weight:900">Catalogo WhatsApp</button><button class="sdc302fb" type="button" style="border:0;border-radius:16px;min-height:54px;background:#1677f2;color:white;font-weight:900">Facebook</button><button class="sdc302ia" type="button" style="border:0;border-radius:16px;min-height:54px;background:#0b63ce;color:white;font-weight:900;grid-column:1/-1">WhatsApp Business IA</button></div>';h.appendChild(d)}
 document.addEventListener('click',e=>{let w=e.target.closest&&e.target.closest('.sdc302wa'),f=e.target.closest&&e.target.closest('.sdc302fb'),i=e.target.closest&&e.target.closest('.sdc302ia');if(w||f||i){let p=cur();if(!p)return toast('No encontre el producto');e.preventDefault();if(w)cp(wa(p),'WhatsApp');if(f)cp(fb(p),'Facebook');if(i)cp(ia(p),'WhatsApp Business IA')}else setTimeout(add,120)},true);
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',add,{once:true});else add();
 setInterval(add,900);
})();

;window.SDC_V305_OPTIMIZED=true;console.info('SD Comayagua v305 optimizado cargado');


;/* ==== js/sdc-v306-cotizar-rapido-botones.js ==== */
(function(){
  'use strict';
  if(window.__sdcV306QuotePatch) return;
  window.__sdcV306QuotePatch=true;

  function isQuoteButton(el){
    return el && el.closest && el.closest('#saveQuote,#toSale,#waText,#downloadDoc,#finishSale,#shortReceipt,#openQuotes,#openClientsFromDoc,#backToQuote,#printDoc');
  }

  // Evita el retraso de doble toque en móvil sin bloquear inputs.
  let last=0;
  document.addEventListener('touchend',function(ev){
    const now=Date.now();
    if(now-last<220 && !ev.target.closest('input,textarea,select,.qtybox')) ev.preventDefault();
    last=now;
  },{passive:false,capture:true});

  // Refuerzo visual: si algún CSS viejo intenta poner botones a 1 columna, esta clase corrige al abrir la cotización.
  function mark(){
    const root=document.getElementById('modalRoot');
    if(root && root.querySelector('.quote-actions-v176')) document.body.classList.add('sdc-v306-quote-open');
    else document.body.classList.remove('sdc-v306-quote-open');
  }
  document.addEventListener('click',function(ev){
    if(isQuoteButton(ev.target)) setTimeout(mark,40);
    else setTimeout(mark,90);
  },true);
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',mark,{once:true}); else mark();
  try{new MutationObserver(mark).observe(document.getElementById('modalRoot')||document.body,{childList:true,subtree:true});}catch(e){}
})();
