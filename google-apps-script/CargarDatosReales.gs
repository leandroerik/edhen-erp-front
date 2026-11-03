/**
 * ====================================================================
 * EDHEN ERP — CARGA AUTOMÁTICA DE DATOS REALES (2026-TEXTIL)
 * ====================================================================
 * 
 * Instrucciones:
 * 1. Abrí tu editor de Apps Script en la hoja de cálculo de Google.
 * 2. Pegá esta función al final de tu "Código.gs".
 * 3. En el selector de funciones (arriba), elegí "cargarDatosReales".
 * 4. Hacé clic en "Ejecutar".
 * 5. ¡Listo! Todas las pestañas de tu planilla se llenarán con tu catálogo
 *    real de artículos, costos de talleres, compras de telas y cortes.
 */

function cargarDatosReales() {
  inicializarHojas();
  
  var talleres = [
  {
    "id": "tal-1",
    "nombre": "Victor",
    "telefono": "1554891316",
    "especialidad": "Remeras y Camisas",
    "precioPorPrendaPorModelo": {}
  },
  {
    "id": "tal-2",
    "nombre": "Willy",
    "telefono": "1554891316",
    "especialidad": "Poplin y Camisería",
    "precioPorPrendaPorModelo": {}
  },
  {
    "id": "tal-3",
    "nombre": "Gregorio (Tío Gregorio)",
    "telefono": "1554891316",
    "especialidad": "Sastrero y Chalecos",
    "precioPorPrendaPorModelo": {}
  },
  {
    "id": "tal-4",
    "nombre": "Walter",
    "telefono": "1554891316",
    "especialidad": "Lino Aura y Pantalones",
    "precioPorPrendaPorModelo": {}
  },
  {
    "id": "tal-5",
    "nombre": "Argentino",
    "telefono": "1554891316",
    "especialidad": "Darlon y Punto",
    "precioPorPrendaPorModelo": {}
  },
  {
    "id": "tal-6",
    "nombre": "Joven",
    "telefono": "1554891316",
    "especialidad": "Friza y Buzos",
    "precioPorPrendaPorModelo": {}
  }
];
  var proveedores = [
  {
    "id": "prov-1",
    "nombre": "MijaTex"
  },
  {
    "id": "prov-2",
    "nombre": "DSTextil"
  },
  {
    "id": "prov-3",
    "nombre": "HR Textil"
  },
  {
    "id": "prov-4",
    "nombre": "Codite"
  },
  {
    "id": "prov-5",
    "nombre": "Memo Textil"
  },
  {
    "id": "prov-6",
    "nombre": "Fashion Collection"
  },
  {
    "id": "prov-7",
    "nombre": "Lea"
  },
  {
    "id": "prov-8",
    "nombre": "Casa Denim"
  }
];
  var compras = [
  {
    "id": "comp-01",
    "codigo": "COMP-0001",
    "fecha": "2025-11-27",
    "proveedorId": "prov-1",
    "proveedorNombre": "MijaTex",
    "telaId": "tel-sastrero",
    "telaNombre": "Creepe Sastrero",
    "unidadCompra": "KILO",
    "precioUnitario": 1700,
    "usada": true,
    "lotes": [
      {
        "id": "l-01",
        "colorId": "col-negro",
        "colorNombre": "Negro",
        "rollos": 2,
        "cantidad": 114,
        "subtotal": 193800
      },
      {
        "id": "l-02",
        "colorId": "col-offwhite",
        "colorNombre": "Off White",
        "rollos": 1,
        "cantidad": 48,
        "subtotal": 81600
      },
      {
        "id": "l-03",
        "colorId": "col-beige",
        "colorNombre": "Beige",
        "rollos": 1,
        "cantidad": 57,
        "subtotal": 96900
      },
      {
        "id": "l-04",
        "colorId": "col-cemento",
        "colorNombre": "Cemento",
        "rollos": 1,
        "cantidad": 53,
        "subtotal": 90100
      }
    ],
    "total": 462400
  },
  {
    "id": "comp-02",
    "codigo": "COMP-0002",
    "fecha": "2025-11-27",
    "proveedorId": "prov-2",
    "proveedorNombre": "DSTextil",
    "telaId": "tel-lino-spandex",
    "telaNombre": "Lino Spandex",
    "unidadCompra": "KILO",
    "precioUnitario": 2500,
    "usada": true,
    "lotes": [
      {
        "id": "l-05",
        "colorId": "col-negro",
        "colorNombre": "Negro",
        "rollos": 1,
        "cantidad": 60,
        "subtotal": 150000
      },
      {
        "id": "l-06",
        "colorId": "col-choco",
        "colorNombre": "Chocolate",
        "rollos": 1,
        "cantidad": 60,
        "subtotal": 150000
      },
      {
        "id": "l-07",
        "colorId": "col-camel",
        "colorNombre": "Camel",
        "rollos": 1,
        "cantidad": 60,
        "subtotal": 150000
      }
    ],
    "total": 450000
  },
  {
    "id": "comp-03",
    "codigo": "COMP-0003",
    "fecha": "2025-01-01",
    "proveedorId": "prov-3",
    "proveedorNombre": "HR Textil",
    "telaId": "tel-poplin",
    "telaNombre": "Poplin",
    "unidadCompra": "METRO",
    "precioUnitario": 3190,
    "usada": true,
    "lotes": [
      {
        "id": "l-08",
        "colorId": "col-blanco",
        "colorNombre": "Blanco",
        "rollos": 2,
        "cantidad": 62.2,
        "subtotal": 198418
      },
      {
        "id": "l-09",
        "colorId": "col-celeste",
        "colorNombre": "Celeste",
        "rollos": 1,
        "cantidad": 70,
        "subtotal": 223300
      },
      {
        "id": "l-10",
        "colorId": "col-beige",
        "colorNombre": "Beige",
        "rollos": 1,
        "cantidad": 65,
        "subtotal": 207350
      }
    ],
    "total": 629068
  },
  {
    "id": "comp-04",
    "codigo": "COMP-0004",
    "fecha": "2026-01-26",
    "proveedorId": "prov-4",
    "proveedorNombre": "Codite",
    "telaId": "tel-darlon",
    "telaNombre": "Darlon 2026",
    "unidadCompra": "KILO",
    "precioUnitario": 7700,
    "usada": true,
    "lotes": [
      {
        "id": "l-11",
        "colorId": "col-gris",
        "colorNombre": "Gris",
        "rollos": 7,
        "cantidad": 164.3,
        "subtotal": 1265110
      },
      {
        "id": "l-12",
        "colorId": "col-negro",
        "colorNombre": "Negro",
        "rollos": 7,
        "cantidad": 169.5,
        "subtotal": 1305150
      },
      {
        "id": "l-13",
        "colorId": "col-choco",
        "colorNombre": "Chocolate",
        "rollos": 1,
        "cantidad": 70,
        "subtotal": 539000
      },
      {
        "id": "l-14",
        "colorId": "col-camel",
        "colorNombre": "Camel",
        "rollos": 4,
        "cantidad": 93.2,
        "subtotal": 717640
      },
      {
        "id": "l-15",
        "colorId": "col-beige",
        "colorNombre": "Beige",
        "rollos": 3,
        "cantidad": 69.8,
        "subtotal": 537460
      },
      {
        "id": "l-16",
        "colorId": "col-offwhite",
        "colorNombre": "Off White",
        "rollos": 2,
        "cantidad": 51.3,
        "subtotal": 395010
      },
      {
        "id": "l-17",
        "colorId": "col-marino",
        "colorNombre": "Marino",
        "rollos": 2,
        "cantidad": 47.1,
        "subtotal": 362670
      }
    ],
    "total": 5122040
  },
  {
    "id": "comp-05",
    "codigo": "COMP-0005",
    "fecha": "2026-01-26",
    "proveedorId": "prov-5",
    "proveedorNombre": "Memo Textil",
    "telaId": "tel-friza-tub",
    "telaNombre": "Friza Tubular",
    "unidadCompra": "KILO",
    "precioUnitario": 13000,
    "usada": true,
    "lotes": [
      {
        "id": "l-18",
        "colorId": "col-burgundy",
        "colorNombre": "Burgundy Crew",
        "rollos": 1,
        "cantidad": 32.32,
        "subtotal": 420160
      },
      {
        "id": "l-19",
        "colorId": "col-deshielo",
        "colorNombre": "Deshielo",
        "rollos": 1,
        "cantidad": 37.1,
        "subtotal": 482300
      }
    ],
    "total": 902460
  },
  {
    "id": "comp-06",
    "codigo": "COMP-0006",
    "fecha": "2026-01-26",
    "proveedorId": "prov-5",
    "proveedorNombre": "Memo Textil",
    "telaId": "tel-friza-ab",
    "telaNombre": "Friza Abierta",
    "unidadCompra": "KILO",
    "precioUnitario": 11500,
    "usada": true,
    "lotes": [
      {
        "id": "l-20",
        "colorId": "col-negro",
        "colorNombre": "Negro",
        "rollos": 1,
        "cantidad": 42.66,
        "subtotal": 490590
      },
      {
        "id": "l-21",
        "colorId": "col-crudo",
        "colorNombre": "Crudo Melange",
        "rollos": 1,
        "cantidad": 36.34,
        "subtotal": 417910
      },
      {
        "id": "l-22",
        "colorId": "col-bornui",
        "colorNombre": "Bornui",
        "rollos": 1,
        "cantidad": 39.34,
        "subtotal": 452410
      },
      {
        "id": "l-23",
        "colorId": "col-frozen",
        "colorNombre": "Café Frozen",
        "rollos": 1,
        "cantidad": 34.42,
        "subtotal": 395830
      }
    ],
    "total": 1756740
  },
  {
    "id": "comp-07",
    "codigo": "COMP-0007",
    "fecha": "2026-01-26",
    "proveedorId": "prov-5",
    "proveedorNombre": "Memo Textil",
    "telaId": "tel-morley-lycra",
    "telaNombre": "Morley c/ Lycra",
    "unidadCompra": "KILO",
    "precioUnitario": 14900,
    "usada": true,
    "lotes": [
      {
        "id": "l-24",
        "colorId": "col-negro",
        "colorNombre": "Negro",
        "rollos": 1,
        "cantidad": 12.08,
        "subtotal": 179992
      },
      {
        "id": "l-25",
        "colorId": "col-crudo",
        "colorNombre": "Crudo Melange",
        "rollos": 1,
        "cantidad": 9.58,
        "subtotal": 142742
      },
      {
        "id": "l-26",
        "colorId": "col-bornui",
        "colorNombre": "Bornui",
        "rollos": 1,
        "cantidad": 9.8,
        "subtotal": 146020
      },
      {
        "id": "l-27",
        "colorId": "col-frozen",
        "colorNombre": "Café Frozen",
        "rollos": 1,
        "cantidad": 8.44,
        "subtotal": 125756
      }
    ],
    "total": 594510
  },
  {
    "id": "comp-08",
    "codigo": "COMP-0008",
    "fecha": "2026-01-26",
    "proveedorId": "prov-5",
    "proveedorNombre": "Memo Textil",
    "telaId": "tel-morley-alg",
    "telaNombre": "Morley Algodón",
    "unidadCompra": "KILO",
    "precioUnitario": 12500,
    "usada": true,
    "lotes": [
      {
        "id": "l-28",
        "colorId": "col-negro",
        "colorNombre": "Negro",
        "rollos": 6,
        "cantidad": 84.32,
        "subtotal": 1054000
      },
      {
        "id": "l-29",
        "colorId": "col-blanco",
        "colorNombre": "Blanco",
        "rollos": 5,
        "cantidad": 66.32,
        "subtotal": 829000
      },
      {
        "id": "l-30",
        "colorId": "col-choco",
        "colorNombre": "Chocolate",
        "rollos": 4,
        "cantidad": 40.06,
        "subtotal": 500750
      },
      {
        "id": "l-31",
        "colorId": "col-azul",
        "colorNombre": "Azul Gant",
        "rollos": 3,
        "cantidad": 44.58,
        "subtotal": 557250
      },
      {
        "id": "l-32",
        "colorId": "col-gris",
        "colorNombre": "Gris Chevy",
        "rollos": 4,
        "cantidad": 54.7,
        "subtotal": 683750
      },
      {
        "id": "l-33",
        "colorId": "col-crudo",
        "colorNombre": "Crudo Vintage",
        "rollos": 5,
        "cantidad": 69,
        "subtotal": 862500
      },
      {
        "id": "l-34",
        "colorId": "col-jengibre",
        "colorNombre": "Jengibre Top",
        "rollos": 4,
        "cantidad": 47.62,
        "subtotal": 595250
      },
      {
        "id": "l-35",
        "colorId": "col-burgundy",
        "colorNombre": "Burgundy Crew",
        "rollos": 6,
        "cantidad": 83.34,
        "subtotal": 1041750
      }
    ],
    "total": 6124250
  },
  {
    "id": "comp-09",
    "codigo": "COMP-0009",
    "fecha": "2025-08-14",
    "proveedorId": "prov-1",
    "proveedorNombre": "MijaTex",
    "telaId": "tel-melville",
    "telaNombre": "Melville",
    "unidadCompra": "KILO",
    "precioUnitario": 9500,
    "usada": true,
    "lotes": [
      {
        "id": "l-36",
        "colorId": "col-negro",
        "colorNombre": "Negro",
        "rollos": 3,
        "cantidad": 74,
        "subtotal": 703000
      },
      {
        "id": "l-37",
        "colorId": "col-offwhite",
        "colorNombre": "Off White",
        "rollos": 2,
        "cantidad": 48.2,
        "subtotal": 457900
      },
      {
        "id": "l-38",
        "colorId": "col-amarillo",
        "colorNombre": "Amarillo",
        "rollos": 1,
        "cantidad": 24.2,
        "subtotal": 229900
      },
      {
        "id": "l-39",
        "colorId": "col-rosa",
        "colorNombre": "Rosa",
        "rollos": 1,
        "cantidad": 24.3,
        "subtotal": 230850
      },
      {
        "id": "l-40",
        "colorId": "col-beige",
        "colorNombre": "Beige",
        "rollos": 2,
        "cantidad": 47.2,
        "subtotal": 448400
      },
      {
        "id": "l-41",
        "colorId": "col-cemento",
        "colorNombre": "Cemento",
        "rollos": 1,
        "cantidad": 23.9,
        "subtotal": 227050
      },
      {
        "id": "l-42",
        "colorId": "col-celeste",
        "colorNombre": "Celeste",
        "rollos": 1,
        "cantidad": 23.6,
        "subtotal": 224200
      },
      {
        "id": "l-43",
        "colorId": "col-gris",
        "colorNombre": "Gris",
        "rollos": 1,
        "cantidad": 24.1,
        "subtotal": 228950
      },
      {
        "id": "l-44",
        "colorId": "col-vainilla",
        "colorNombre": "Vainilla",
        "rollos": 1,
        "cantidad": 24.2,
        "subtotal": 229900
      },
      {
        "id": "l-45",
        "colorId": "col-choco",
        "colorNombre": "Chocolate",
        "rollos": 1,
        "cantidad": 25,
        "subtotal": 237500
      },
      {
        "id": "l-46",
        "colorId": "col-marron",
        "colorNombre": "Marrón",
        "rollos": 2,
        "cantidad": 50.5,
        "subtotal": 479750
      }
    ],
    "total": 3697400
  },
  {
    "id": "comp-10",
    "codigo": "COMP-0010",
    "fecha": "2026-08-02",
    "proveedorId": "prov-1",
    "proveedorNombre": "MijaTex",
    "telaId": "tel-sastrero",
    "telaNombre": "Sastrero",
    "unidadCompra": "KILO",
    "precioUnitario": 2600,
    "usada": true,
    "lotes": [
      {
        "id": "l-47",
        "colorId": "col-negro",
        "colorNombre": "Negro",
        "rollos": 5,
        "cantidad": 278,
        "subtotal": 722800
      },
      {
        "id": "l-48",
        "colorId": "col-blanco",
        "colorNombre": "Blanco",
        "rollos": 5,
        "cantidad": 293,
        "subtotal": 761800
      },
      {
        "id": "l-49",
        "colorId": "col-choco",
        "colorNombre": "Chocolate",
        "rollos": 6,
        "cantidad": 365,
        "subtotal": 949000
      },
      {
        "id": "l-50",
        "colorId": "col-cemento",
        "colorNombre": "Cemento Ivory",
        "rollos": 4,
        "cantidad": 245,
        "subtotal": 637000
      }
    ],
    "total": 3070600
  },
  {
    "id": "comp-11",
    "codigo": "COMP-0011",
    "fecha": "2026-08-02",
    "proveedorId": "prov-6",
    "proveedorNombre": "Fashion Collection",
    "telaId": "tel-lino-aura",
    "telaNombre": "Lino Aura",
    "unidadCompra": "KILO",
    "precioUnitario": 3400,
    "usada": true,
    "lotes": [
      {
        "id": "l-51",
        "colorId": "col-offwhite",
        "colorNombre": "Off White",
        "rollos": 7,
        "cantidad": 368.6,
        "subtotal": 1253240
      },
      {
        "id": "l-52",
        "colorId": "col-arena",
        "colorNombre": "Arena",
        "rollos": 4,
        "cantidad": 243.1,
        "subtotal": 826540
      },
      {
        "id": "l-53",
        "colorId": "col-celeste",
        "colorNombre": "Celeste",
        "rollos": 3,
        "cantidad": 131.3,
        "subtotal": 446420
      },
      {
        "id": "l-54",
        "colorId": "col-rosa",
        "colorNombre": "Rosa",
        "rollos": 2,
        "cantidad": 125.9,
        "subtotal": 428060
      },
      {
        "id": "l-55",
        "colorId": "col-choco",
        "colorNombre": "Chocolate",
        "rollos": 6,
        "cantidad": 370.6,
        "subtotal": 1260040
      },
      {
        "id": "l-56",
        "colorId": "col-negro",
        "colorNombre": "Negro",
        "rollos": 6,
        "cantidad": 319,
        "subtotal": 1084600
      }
    ],
    "total": 5298900
  },
  {
    "id": "comp-12",
    "codigo": "COMP-0012",
    "fecha": "2026-08-18",
    "proveedorId": "prov-7",
    "proveedorNombre": "Lea",
    "telaId": "tel-poplin-cam",
    "telaNombre": "Poplin Camisero",
    "unidadCompra": "KILO",
    "precioUnitario": 3200,
    "usada": true,
    "lotes": [
      {
        "id": "l-57",
        "colorId": "col-celeste",
        "colorNombre": "Celeste",
        "rollos": 4,
        "cantidad": 275.2,
        "subtotal": 880640
      },
      {
        "id": "l-58",
        "colorId": "col-blanco",
        "colorNombre": "Blanco",
        "rollos": 3,
        "cantidad": 206.6,
        "subtotal": 661120
      },
      {
        "id": "l-59",
        "colorId": "col-amarillo",
        "colorNombre": "Amarillo",
        "rollos": 2,
        "cantidad": 155.9,
        "subtotal": 498880
      },
      {
        "id": "l-60",
        "colorId": "col-rosa",
        "colorNombre": "Rosa",
        "rollos": 1,
        "cantidad": 73,
        "subtotal": 233600
      }
    ],
    "total": 2274240
  }
];
  var articulos = [
  {
    "id": "art-001",
    "codigoArticulo": "ART-0001",
    "nombre": "Short Pollera A",
    "descripcion": "Tela Sastrero · 425 prendas",
    "cantidadPrendas": 425,
    "costoTelaTotalUsado": 761800,
    "costoTelaPorPrenda": 1792,
    "manoObra": 3500,
    "aviosTotales": 221999,
    "aviosPorPrenda": 522,
    "costoUnitario": 5815,
    "costoTotalProduccion": 2471375,
    "margenGanancia": 106,
    "precioSugerido": 12000,
    "precioVenta": 12000,
    "gananciaUnitaria": 6185,
    "gananciaTotal": 2628625,
    "margenReal": 106.4,
    "tallerId": "tal-3",
    "tallerNombre": "Gregorio (Tío Gregorio)",
    "corteId": "corte-001",
    "telas": [
      {
        "stockKey": "stk-sastrero",
        "telaNombre": "Sastrero",
        "colorNombre": "Surtido",
        "unidad": "KILO",
        "rollosUsados": 9,
        "rollosDisponibles": 9,
        "rollosLibres": 0,
        "cantidadUsar": 305,
        "cantidadLibre": 0,
        "precioUnitario": 2500,
        "costoUsado": 761800
      }
    ],
    "avios": [
      {
        "id": "av-0-1",
        "nombre": "Avíos varios / Elástico",
        "monto": 522,
        "porPrenda": true
      }
    ]
  },
  {
    "id": "art-002",
    "codigoArticulo": "ART-0002",
    "nombre": "Short Pollera B",
    "descripcion": "Tela Sastrero · 225 prendas",
    "cantidadPrendas": 225,
    "costoTelaTotalUsado": 444600,
    "costoTelaPorPrenda": 1976,
    "manoObra": 3200,
    "aviosTotales": 114001,
    "aviosPorPrenda": 507,
    "costoUnitario": 5683,
    "costoTotalProduccion": 1278675,
    "margenGanancia": 111,
    "precioSugerido": 12000,
    "precioVenta": 12000,
    "gananciaUnitaria": 6317,
    "gananciaTotal": 1421325,
    "margenReal": 111.2,
    "tallerId": "tal-3",
    "tallerNombre": "Gregorio (Tío Gregorio)",
    "corteId": "corte-002",
    "telas": [
      {
        "stockKey": "stk-sastrero",
        "telaNombre": "Sastrero",
        "colorNombre": "Surtido",
        "unidad": "KILO",
        "rollosUsados": 5,
        "rollosDisponibles": 5,
        "rollosLibres": 0,
        "cantidadUsar": 178,
        "cantidadLibre": 0,
        "precioUnitario": 2500,
        "costoUsado": 444600
      }
    ],
    "avios": [
      {
        "id": "av-1-1",
        "nombre": "Avíos varios / Elástico",
        "monto": 507,
        "porPrenda": true
      }
    ]
  },
  {
    "id": "art-003",
    "codigoArticulo": "ART-0003",
    "nombre": "Short Pollera 1",
    "descripcion": "Tela Sastrero · 445 prendas",
    "cantidadPrendas": 445,
    "costoTelaTotalUsado": 761800,
    "costoTelaPorPrenda": 1712,
    "manoObra": 3000,
    "aviosTotales": 253650,
    "aviosPorPrenda": 570,
    "costoUnitario": 5282,
    "costoTotalProduccion": 2350490,
    "margenGanancia": 127,
    "precioSugerido": 12000,
    "precioVenta": 12000,
    "gananciaUnitaria": 6718,
    "gananciaTotal": 2989510,
    "margenReal": 127.2,
    "tallerId": "tal-3",
    "tallerNombre": "Gregorio (Tío Gregorio)",
    "corteId": "corte-003",
    "telas": [
      {
        "stockKey": "stk-sastrero",
        "telaNombre": "Sastrero",
        "colorNombre": "Surtido",
        "unidad": "KILO",
        "rollosUsados": 9,
        "rollosDisponibles": 9,
        "rollosLibres": 0,
        "cantidadUsar": 305,
        "cantidadLibre": 0,
        "precioUnitario": 2500,
        "costoUsado": 761800
      }
    ],
    "avios": [
      {
        "id": "av-2-1",
        "nombre": "Avíos varios / Elástico",
        "monto": 570,
        "porPrenda": true
      }
    ]
  },
  {
    "id": "art-004",
    "codigoArticulo": "ART-0004",
    "nombre": "Short Pollera 2",
    "descripcion": "Tela Sastrero · 425 prendas",
    "cantidadPrendas": 425,
    "costoTelaTotalUsado": 761800,
    "costoTelaPorPrenda": 1792,
    "manoObra": 3500,
    "aviosTotales": 221999,
    "aviosPorPrenda": 522,
    "costoUnitario": 5815,
    "costoTotalProduccion": 2471375,
    "margenGanancia": 106,
    "precioSugerido": 12000,
    "precioVenta": 12000,
    "gananciaUnitaria": 6185,
    "gananciaTotal": 2628625,
    "margenReal": 106.4,
    "tallerId": "tal-3",
    "tallerNombre": "Gregorio (Tío Gregorio)",
    "corteId": "corte-004",
    "telas": [
      {
        "stockKey": "stk-sastrero",
        "telaNombre": "Sastrero",
        "colorNombre": "Surtido",
        "unidad": "KILO",
        "rollosUsados": 9,
        "rollosDisponibles": 9,
        "rollosLibres": 0,
        "cantidadUsar": 305,
        "cantidadLibre": 0,
        "precioUnitario": 2500,
        "costoUsado": 761800
      }
    ],
    "avios": [
      {
        "id": "av-3-1",
        "nombre": "Avíos varios / Elástico",
        "monto": 522,
        "porPrenda": true
      }
    ]
  },
  {
    "id": "art-005",
    "codigoArticulo": "ART-0005",
    "nombre": "Chaleco 1",
    "descripcion": "Tela Sastrero · 430 prendas",
    "cantidadPrendas": 430,
    "costoTelaTotalUsado": 722800,
    "costoTelaPorPrenda": 1681,
    "manoObra": 3500,
    "aviosTotales": 292000,
    "aviosPorPrenda": 679,
    "costoUnitario": 5860,
    "costoTotalProduccion": 2519800,
    "margenGanancia": 105,
    "precioSugerido": 12000,
    "precioVenta": 12000,
    "gananciaUnitaria": 6140,
    "gananciaTotal": 2640200,
    "margenReal": 104.8,
    "tallerId": "tal-3",
    "tallerNombre": "Gregorio (Tío Gregorio)",
    "corteId": "corte-005",
    "telas": [
      {
        "stockKey": "stk-sastrero",
        "telaNombre": "Sastrero",
        "colorNombre": "Surtido",
        "unidad": "KILO",
        "rollosUsados": 9,
        "rollosDisponibles": 9,
        "rollosLibres": 0,
        "cantidadUsar": 289,
        "cantidadLibre": 0,
        "precioUnitario": 2500,
        "costoUsado": 722800
      }
    ],
    "avios": [
      {
        "id": "av-4-1",
        "nombre": "Avíos varios / Elástico",
        "monto": 679,
        "porPrenda": true
      }
    ]
  },
  {
    "id": "art-006",
    "codigoArticulo": "ART-0006",
    "nombre": "Chaleco 2",
    "descripcion": "Tela Sastrero · 515 prendas",
    "cantidadPrendas": 515,
    "costoTelaTotalUsado": 949001,
    "costoTelaPorPrenda": 1843,
    "manoObra": 3500,
    "aviosTotales": 290002,
    "aviosPorPrenda": 563,
    "costoUnitario": 5906,
    "costoTotalProduccion": 3041590,
    "margenGanancia": 103,
    "precioSugerido": 12000,
    "precioVenta": 12000,
    "gananciaUnitaria": 6094,
    "gananciaTotal": 3138410,
    "margenReal": 103.2,
    "tallerId": "tal-3",
    "tallerNombre": "Gregorio (Tío Gregorio)",
    "corteId": "corte-006",
    "telas": [
      {
        "stockKey": "stk-sastrero",
        "telaNombre": "Sastrero",
        "colorNombre": "Surtido",
        "unidad": "KILO",
        "rollosUsados": 10,
        "rollosDisponibles": 10,
        "rollosLibres": 0,
        "cantidadUsar": 380,
        "cantidadLibre": 0,
        "precioUnitario": 2500,
        "costoUsado": 949001
      }
    ],
    "avios": [
      {
        "id": "av-5-1",
        "nombre": "Avíos varios / Elástico",
        "monto": 563,
        "porPrenda": true
      }
    ]
  },
  {
    "id": "art-007",
    "codigoArticulo": "ART-0007",
    "nombre": "Remera Morley",
    "descripcion": "Tela Morley · 220 prendas",
    "cantidadPrendas": 220,
    "costoTelaTotalUsado": 384446,
    "costoTelaPorPrenda": 1747,
    "manoObra": 1300,
    "aviosTotales": 0,
    "aviosPorPrenda": 0,
    "costoUnitario": 3047,
    "costoTotalProduccion": 670340,
    "margenGanancia": 113,
    "precioSugerido": 6500,
    "precioVenta": 6500,
    "gananciaUnitaria": 3453,
    "gananciaTotal": 759660,
    "margenReal": 113.3,
    "tallerId": "tal-1",
    "tallerNombre": "Victor",
    "corteId": "corte-007",
    "telas": [
      {
        "stockKey": "stk-morley",
        "telaNombre": "Morley",
        "colorNombre": "Surtido",
        "unidad": "KILO",
        "rollosUsados": 4,
        "rollosDisponibles": 4,
        "rollosLibres": 0,
        "cantidadUsar": 154,
        "cantidadLibre": 0,
        "precioUnitario": 2500,
        "costoUsado": 384446
      }
    ],
    "avios": []
  },
  {
    "id": "art-008",
    "codigoArticulo": "ART-0008",
    "nombre": "Remera Escote U",
    "descripcion": "Tela Morley · 685 prendas",
    "cantidadPrendas": 685,
    "costoTelaTotalUsado": 1457749,
    "costoTelaPorPrenda": 2128,
    "manoObra": 1300,
    "aviosTotales": 0,
    "aviosPorPrenda": 0,
    "costoUnitario": 3428,
    "costoTotalProduccion": 2348180,
    "margenGanancia": 90,
    "precioSugerido": 6500,
    "precioVenta": 6500,
    "gananciaUnitaria": 3072,
    "gananciaTotal": 2104320,
    "margenReal": 89.6,
    "tallerId": "tal-1",
    "tallerNombre": "Victor",
    "corteId": "corte-008",
    "telas": [
      {
        "stockKey": "stk-morley",
        "telaNombre": "Morley",
        "colorNombre": "Surtido",
        "unidad": "KILO",
        "rollosUsados": 14,
        "rollosDisponibles": 14,
        "rollosLibres": 0,
        "cantidadUsar": 583,
        "cantidadLibre": 0,
        "precioUnitario": 2500,
        "costoUsado": 1457749
      }
    ],
    "avios": []
  },
  {
    "id": "art-009",
    "codigoArticulo": "ART-0009",
    "nombre": "Remera Básica",
    "descripcion": "Tela Morley · 505 prendas",
    "cantidadPrendas": 505,
    "costoTelaTotalUsado": 1241002,
    "costoTelaPorPrenda": 2457,
    "manoObra": 1300,
    "aviosTotales": 0,
    "aviosPorPrenda": 0,
    "costoUnitario": 3757,
    "costoTotalProduccion": 1897285,
    "margenGanancia": 60,
    "precioSugerido": 6000,
    "precioVenta": 6000,
    "gananciaUnitaria": 2243,
    "gananciaTotal": 1132715,
    "margenReal": 59.7,
    "tallerId": "tal-1",
    "tallerNombre": "Victor",
    "corteId": "corte-009",
    "telas": [
      {
        "stockKey": "stk-morley",
        "telaNombre": "Morley",
        "colorNombre": "Surtido",
        "unidad": "KILO",
        "rollosUsados": 10,
        "rollosDisponibles": 10,
        "rollosLibres": 0,
        "cantidadUsar": 496,
        "cantidadLibre": 0,
        "precioUnitario": 2500,
        "costoUsado": 1241002
      }
    ],
    "avios": []
  },
  {
    "id": "art-010",
    "codigoArticulo": "ART-0010",
    "nombre": "Top Tu",
    "descripcion": "Tela Morley · 93 prendas",
    "cantidadPrendas": 93,
    "costoTelaTotalUsado": 132975,
    "costoTelaPorPrenda": 1430,
    "manoObra": 1000,
    "aviosTotales": 0,
    "aviosPorPrenda": 0,
    "costoUnitario": 2430,
    "costoTotalProduccion": 225990,
    "margenGanancia": 65,
    "precioSugerido": 4000,
    "precioVenta": 4000,
    "gananciaUnitaria": 1570,
    "gananciaTotal": 146010,
    "margenReal": 64.6,
    "tallerId": "tal-1",
    "tallerNombre": "Victor",
    "corteId": "corte-010",
    "telas": [
      {
        "stockKey": "stk-morley",
        "telaNombre": "Morley",
        "colorNombre": "Surtido",
        "unidad": "KILO",
        "rollosUsados": 2,
        "rollosDisponibles": 2,
        "rollosLibres": 0,
        "cantidadUsar": 53,
        "cantidadLibre": 0,
        "precioUnitario": 2500,
        "costoUsado": 132975
      }
    ],
    "avios": []
  },
  {
    "id": "art-011",
    "codigoArticulo": "ART-0011",
    "nombre": "Camisetas Morley Algodón",
    "descripcion": "Tela Morley · 465 prendas",
    "cantidadPrendas": 465,
    "costoTelaTotalUsado": 1329751,
    "costoTelaPorPrenda": 2860,
    "manoObra": 1500,
    "aviosTotales": 0,
    "aviosPorPrenda": 0,
    "costoUnitario": 4360,
    "costoTotalProduccion": 2027400,
    "margenGanancia": 56,
    "precioSugerido": 6800,
    "precioVenta": 6800,
    "gananciaUnitaria": 2440,
    "gananciaTotal": 1134600,
    "margenReal": 56,
    "tallerId": "tal-1",
    "tallerNombre": "Victor",
    "corteId": "corte-011",
    "telas": [
      {
        "stockKey": "stk-morley",
        "telaNombre": "Morley",
        "colorNombre": "Surtido",
        "unidad": "KILO",
        "rollosUsados": 9,
        "rollosDisponibles": 9,
        "rollosLibres": 0,
        "cantidadUsar": 532,
        "cantidadLibre": 0,
        "precioUnitario": 2500,
        "costoUsado": 1329751
      }
    ],
    "avios": []
  },
  {
    "id": "art-012",
    "codigoArticulo": "ART-0012",
    "nombre": "Cuello V",
    "descripcion": "Tela Morley · 240 prendas",
    "cantidadPrendas": 240,
    "costoTelaTotalUsado": 739481,
    "costoTelaPorPrenda": 3081,
    "manoObra": 1500,
    "aviosTotales": 45000,
    "aviosPorPrenda": 188,
    "costoUnitario": 4769,
    "costoTotalProduccion": 1144560,
    "margenGanancia": 68,
    "precioSugerido": 8000,
    "precioVenta": 8000,
    "gananciaUnitaria": 3231,
    "gananciaTotal": 775440,
    "margenReal": 67.8,
    "tallerId": "tal-1",
    "tallerNombre": "Victor",
    "corteId": "corte-012",
    "telas": [
      {
        "stockKey": "stk-morley",
        "telaNombre": "Morley",
        "colorNombre": "Surtido",
        "unidad": "KILO",
        "rollosUsados": 5,
        "rollosDisponibles": 5,
        "rollosLibres": 0,
        "cantidadUsar": 296,
        "cantidadLibre": 0,
        "precioUnitario": 2500,
        "costoUsado": 739481
      }
    ],
    "avios": [
      {
        "id": "av-11-1",
        "nombre": "Avíos varios / Elástico",
        "monto": 188,
        "porPrenda": true
      }
    ]
  },
  {
    "id": "art-013",
    "codigoArticulo": "ART-0013",
    "nombre": "Cuello U",
    "descripcion": "Tela Morley · 240 prendas",
    "cantidadPrendas": 240,
    "costoTelaTotalUsado": 739481,
    "costoTelaPorPrenda": 3081,
    "manoObra": 1500,
    "aviosTotales": 45000,
    "aviosPorPrenda": 188,
    "costoUnitario": 4769,
    "costoTotalProduccion": 1144560,
    "margenGanancia": 68,
    "precioSugerido": 8000,
    "precioVenta": 8000,
    "gananciaUnitaria": 3231,
    "gananciaTotal": 775440,
    "margenReal": 67.8,
    "tallerId": "tal-1",
    "tallerNombre": "Victor",
    "corteId": "corte-013",
    "telas": [
      {
        "stockKey": "stk-morley",
        "telaNombre": "Morley",
        "colorNombre": "Surtido",
        "unidad": "KILO",
        "rollosUsados": 5,
        "rollosDisponibles": 5,
        "rollosLibres": 0,
        "cantidadUsar": 296,
        "cantidadLibre": 0,
        "precioUnitario": 2500,
        "costoUsado": 739481
      }
    ],
    "avios": [
      {
        "id": "av-12-1",
        "nombre": "Avíos varios / Elástico",
        "monto": 188,
        "porPrenda": true
      }
    ]
  },
  {
    "id": "art-014",
    "codigoArticulo": "ART-0014",
    "nombre": "Blusa Cuadrado y Cuello",
    "descripcion": "Tela Melville · 608 prendas",
    "cantidadPrendas": 608,
    "costoTelaTotalUsado": 1042367,
    "costoTelaPorPrenda": 1714,
    "manoObra": 1300,
    "aviosTotales": 0,
    "aviosPorPrenda": 0,
    "costoUnitario": 3014,
    "costoTotalProduccion": 1832512,
    "margenGanancia": 116,
    "precioSugerido": 6500,
    "precioVenta": 6500,
    "gananciaUnitaria": 3486,
    "gananciaTotal": 2119488,
    "margenReal": 115.7,
    "tallerId": "tal-3",
    "tallerNombre": "Gregorio (Tío Gregorio)",
    "corteId": "corte-014",
    "telas": [
      {
        "stockKey": "stk-melville",
        "telaNombre": "Melville",
        "colorNombre": "Surtido",
        "unidad": "KILO",
        "rollosUsados": 12,
        "rollosDisponibles": 12,
        "rollosLibres": 0,
        "cantidadUsar": 417,
        "cantidadLibre": 0,
        "precioUnitario": 2500,
        "costoUsado": 1042367
      }
    ],
    "avios": []
  },
  {
    "id": "art-015",
    "codigoArticulo": "ART-0015",
    "nombre": "Blusa Cuadrado Doble Talle 2",
    "descripcion": "Tela Melville · 130 prendas",
    "cantidadPrendas": 130,
    "costoTelaTotalUsado": 222875,
    "costoTelaPorPrenda": 1714,
    "manoObra": 1000,
    "aviosTotales": 0,
    "aviosPorPrenda": 0,
    "costoUnitario": 2714,
    "costoTotalProduccion": 352820,
    "margenGanancia": 140,
    "precioSugerido": 6500,
    "precioVenta": 6500,
    "gananciaUnitaria": 3786,
    "gananciaTotal": 492180,
    "margenReal": 139.5,
    "tallerId": "tal-3",
    "tallerNombre": "Gregorio (Tío Gregorio)",
    "corteId": "corte-015",
    "telas": [
      {
        "stockKey": "stk-melville",
        "telaNombre": "Melville",
        "colorNombre": "Surtido",
        "unidad": "KILO",
        "rollosUsados": 3,
        "rollosDisponibles": 3,
        "rollosLibres": 0,
        "cantidadUsar": 89,
        "cantidadLibre": 0,
        "precioUnitario": 2500,
        "costoUsado": 222875
      }
    ],
    "avios": []
  },
  {
    "id": "art-016",
    "codigoArticulo": "ART-0016",
    "nombre": "Cuello Bote",
    "descripcion": "Tela Melville · 220 prendas",
    "cantidadPrendas": 220,
    "costoTelaTotalUsado": 184870,
    "costoTelaPorPrenda": 840,
    "manoObra": 1500,
    "aviosTotales": 0,
    "aviosPorPrenda": 0,
    "costoUnitario": 2340,
    "costoTotalProduccion": 514800,
    "margenGanancia": 114,
    "precioSugerido": 5000,
    "precioVenta": 5000,
    "gananciaUnitaria": 2660,
    "gananciaTotal": 585200,
    "margenReal": 113.7,
    "tallerId": "tal-3",
    "tallerNombre": "Gregorio (Tío Gregorio)",
    "corteId": "corte-016",
    "telas": [
      {
        "stockKey": "stk-melville",
        "telaNombre": "Melville",
        "colorNombre": "Surtido",
        "unidad": "KILO",
        "rollosUsados": 4,
        "rollosDisponibles": 4,
        "rollosLibres": 0,
        "cantidadUsar": 74,
        "cantidadLibre": 0,
        "precioUnitario": 2500,
        "costoUsado": 184870
      }
    ],
    "avios": []
  },
  {
    "id": "art-017",
    "codigoArticulo": "ART-0017",
    "nombre": "Top Tortuga",
    "descripcion": "Tela Melville · 120 prendas",
    "cantidadPrendas": 120,
    "costoTelaTotalUsado": 184870,
    "costoTelaPorPrenda": 1541,
    "manoObra": 1300,
    "aviosTotales": 0,
    "aviosPorPrenda": 0,
    "costoUnitario": 2841,
    "costoTotalProduccion": 340920,
    "margenGanancia": 41,
    "precioSugerido": 4000,
    "precioVenta": 4000,
    "gananciaUnitaria": 1159,
    "gananciaTotal": 139080,
    "margenReal": 40.8,
    "tallerId": "tal-3",
    "tallerNombre": "Gregorio (Tío Gregorio)",
    "corteId": "corte-017",
    "telas": [
      {
        "stockKey": "stk-melville",
        "telaNombre": "Melville",
        "colorNombre": "Surtido",
        "unidad": "KILO",
        "rollosUsados": 2,
        "rollosDisponibles": 2,
        "rollosLibres": 0,
        "cantidadUsar": 74,
        "cantidadLibre": 0,
        "precioUnitario": 2500,
        "costoUsado": 184870
      }
    ],
    "avios": []
  },
  {
    "id": "art-018",
    "codigoArticulo": "ART-0018",
    "nombre": "Pantalón Aura 2 y 4",
    "descripcion": "Tela Lino Aura · 198 prendas",
    "cantidadPrendas": 198,
    "costoTelaTotalUsado": 578578,
    "costoTelaPorPrenda": 2922,
    "manoObra": 2000,
    "aviosTotales": 40000,
    "aviosPorPrenda": 202,
    "costoUnitario": 5124,
    "costoTotalProduccion": 1014552,
    "margenGanancia": 134,
    "precioSugerido": 12000,
    "precioVenta": 12000,
    "gananciaUnitaria": 6876,
    "gananciaTotal": 1361448,
    "margenReal": 134.2,
    "tallerId": "tal-4",
    "tallerNombre": "Walter",
    "corteId": "corte-018",
    "telas": [
      {
        "stockKey": "stk-lino aura",
        "telaNombre": "Lino Aura",
        "colorNombre": "Surtido",
        "unidad": "KILO",
        "rollosUsados": 4,
        "rollosDisponibles": 4,
        "rollosLibres": 0,
        "cantidadUsar": 231,
        "cantidadLibre": 0,
        "precioUnitario": 2500,
        "costoUsado": 578578
      }
    ],
    "avios": [
      {
        "id": "av-17-1",
        "nombre": "Avíos varios / Elástico",
        "monto": 202,
        "porPrenda": true
      }
    ]
  },
  {
    "id": "art-019",
    "codigoArticulo": "ART-0019",
    "nombre": "Blusa Elástico T.Único",
    "descripcion": "Tela Lino Aura · 99 prendas",
    "cantidadPrendas": 99,
    "costoTelaTotalUsado": 247962,
    "costoTelaPorPrenda": 2505,
    "manoObra": 1700,
    "aviosTotales": 16000,
    "aviosPorPrenda": 162,
    "costoUnitario": 4366,
    "costoTotalProduccion": 432234,
    "margenGanancia": 129,
    "precioSugerido": 10000,
    "precioVenta": 10000,
    "gananciaUnitaria": 5634,
    "gananciaTotal": 557766,
    "margenReal": 129,
    "tallerId": "tal-4",
    "tallerNombre": "Walter",
    "corteId": "corte-019",
    "telas": [
      {
        "stockKey": "stk-lino aura",
        "telaNombre": "Lino Aura",
        "colorNombre": "Surtido",
        "unidad": "KILO",
        "rollosUsados": 2,
        "rollosDisponibles": 2,
        "rollosLibres": 0,
        "cantidadUsar": 99,
        "cantidadLibre": 0,
        "precioUnitario": 2500,
        "costoUsado": 247962
      }
    ],
    "avios": [
      {
        "id": "av-18-1",
        "nombre": "Avíos varios / Elástico",
        "monto": 162,
        "porPrenda": true
      }
    ]
  },
  {
    "id": "art-020",
    "codigoArticulo": "ART-0020",
    "nombre": "Pantalón Aura 1 y 3",
    "descripcion": "Tela Lino Aura · 122 prendas",
    "cantidadPrendas": 122,
    "costoTelaTotalUsado": 578578,
    "costoTelaPorPrenda": 4742,
    "manoObra": 2000,
    "aviosTotales": 40000,
    "aviosPorPrenda": 328,
    "costoUnitario": 7070,
    "costoTotalProduccion": 862540,
    "margenGanancia": 70,
    "precioSugerido": 12000,
    "precioVenta": 12000,
    "gananciaUnitaria": 4930,
    "gananciaTotal": 601460,
    "margenReal": 69.7,
    "tallerId": "tal-4",
    "tallerNombre": "Walter",
    "corteId": "corte-020",
    "telas": [
      {
        "stockKey": "stk-lino aura",
        "telaNombre": "Lino Aura",
        "colorNombre": "Surtido",
        "unidad": "KILO",
        "rollosUsados": 2,
        "rollosDisponibles": 2,
        "rollosLibres": 0,
        "cantidadUsar": 231,
        "cantidadLibre": 0,
        "precioUnitario": 2500,
        "costoUsado": 578578
      }
    ],
    "avios": [
      {
        "id": "av-19-1",
        "nombre": "Avíos varios / Elástico",
        "monto": 328,
        "porPrenda": true
      }
    ]
  },
  {
    "id": "art-021",
    "codigoArticulo": "ART-0021",
    "nombre": "Blusa Elástico T.Único 2",
    "descripcion": "Tela Lino Aura · 61 prendas",
    "cantidadPrendas": 61,
    "costoTelaTotalUsado": 165308,
    "costoTelaPorPrenda": 2710,
    "manoObra": 1700,
    "aviosTotales": 16000,
    "aviosPorPrenda": 262,
    "costoUnitario": 4672,
    "costoTotalProduccion": 284992,
    "margenGanancia": 114,
    "precioSugerido": 10000,
    "precioVenta": 10000,
    "gananciaUnitaria": 5328,
    "gananciaTotal": 325008,
    "margenReal": 114,
    "tallerId": "tal-4",
    "tallerNombre": "Walter",
    "corteId": "corte-021",
    "telas": [
      {
        "stockKey": "stk-lino aura",
        "telaNombre": "Lino Aura",
        "colorNombre": "Surtido",
        "unidad": "KILO",
        "rollosUsados": 1,
        "rollosDisponibles": 1,
        "rollosLibres": 0,
        "cantidadUsar": 66,
        "cantidadLibre": 0,
        "precioUnitario": 2500,
        "costoUsado": 165308
      }
    ],
    "avios": [
      {
        "id": "av-20-1",
        "nombre": "Avíos varios / Elástico",
        "monto": 262,
        "porPrenda": true
      }
    ]
  },
  {
    "id": "art-022",
    "codigoArticulo": "ART-0022",
    "nombre": "Short Aura 2 Volado",
    "descripcion": "Tela Lino Aura · 272 prendas",
    "cantidadPrendas": 272,
    "costoTelaTotalUsado": 874480,
    "costoTelaPorPrenda": 3215,
    "manoObra": 2000,
    "aviosTotales": 40000,
    "aviosPorPrenda": 147,
    "costoUnitario": 5362,
    "costoTotalProduccion": 1458464,
    "margenGanancia": 59,
    "precioSugerido": 8500,
    "precioVenta": 8500,
    "gananciaUnitaria": 3138,
    "gananciaTotal": 853536,
    "margenReal": 58.5,
    "tallerId": "tal-4",
    "tallerNombre": "Walter",
    "corteId": "corte-022",
    "telas": [
      {
        "stockKey": "stk-lino aura",
        "telaNombre": "Lino Aura",
        "colorNombre": "Surtido",
        "unidad": "KILO",
        "rollosUsados": 5,
        "rollosDisponibles": 5,
        "rollosLibres": 0,
        "cantidadUsar": 350,
        "cantidadLibre": 0,
        "precioUnitario": 2500,
        "costoUsado": 874480
      }
    ],
    "avios": [
      {
        "id": "av-21-1",
        "nombre": "Avíos varios / Elástico",
        "monto": 147,
        "porPrenda": true
      }
    ]
  },
  {
    "id": "art-023",
    "codigoArticulo": "ART-0023",
    "nombre": "Short Aura Común 1",
    "descripcion": "Tela Lino Aura · 300 prendas",
    "cantidadPrendas": 300,
    "costoTelaTotalUsado": 826539,
    "costoTelaPorPrenda": 2755,
    "manoObra": 2000,
    "aviosTotales": 39999,
    "aviosPorPrenda": 133,
    "costoUnitario": 4888,
    "costoTotalProduccion": 1466400,
    "margenGanancia": 64,
    "precioSugerido": 8000,
    "precioVenta": 8000,
    "gananciaUnitaria": 3112,
    "gananciaTotal": 933600,
    "margenReal": 63.7,
    "tallerId": "tal-4",
    "tallerNombre": "Walter",
    "corteId": "corte-023",
    "telas": [
      {
        "stockKey": "stk-lino aura",
        "telaNombre": "Lino Aura",
        "colorNombre": "Surtido",
        "unidad": "KILO",
        "rollosUsados": 6,
        "rollosDisponibles": 6,
        "rollosLibres": 0,
        "cantidadUsar": 331,
        "cantidadLibre": 0,
        "precioUnitario": 2500,
        "costoUsado": 826539
      }
    ],
    "avios": [
      {
        "id": "av-22-1",
        "nombre": "Avíos varios / Elástico",
        "monto": 133,
        "porPrenda": true
      }
    ]
  },
  {
    "id": "art-024",
    "codigoArticulo": "ART-0024",
    "nombre": "Camisa Lino Aura",
    "descripcion": "Tela Lino Aura · 517 prendas",
    "cantidadPrendas": 517,
    "costoTelaTotalUsado": 1688098,
    "costoTelaPorPrenda": 3265,
    "manoObra": 3000,
    "aviosTotales": 259591,
    "aviosPorPrenda": 502,
    "costoUnitario": 6767,
    "costoTotalProduccion": 3498539,
    "margenGanancia": 114,
    "precioSugerido": 14500,
    "precioVenta": 14500,
    "gananciaUnitaria": 7733,
    "gananciaTotal": 3997961,
    "margenReal": 114.3,
    "tallerId": "tal-1",
    "tallerNombre": "Victor",
    "corteId": "corte-024",
    "telas": [
      {
        "stockKey": "stk-lino aura",
        "telaNombre": "Lino Aura",
        "colorNombre": "Surtido",
        "unidad": "KILO",
        "rollosUsados": 10,
        "rollosDisponibles": 10,
        "rollosLibres": 0,
        "cantidadUsar": 675,
        "cantidadLibre": 0,
        "precioUnitario": 2500,
        "costoUsado": 1688098
      }
    ],
    "avios": [
      {
        "id": "av-23-1",
        "nombre": "Avíos varios / Elástico",
        "monto": 502,
        "porPrenda": true
      }
    ]
  },
  {
    "id": "art-025",
    "codigoArticulo": "ART-0025",
    "nombre": "Poplin Elástico x Tu",
    "descripcion": "Tela Poplin · 101 prendas",
    "cantidadPrendas": 101,
    "costoTelaTotalUsado": 229920,
    "costoTelaPorPrenda": 2276,
    "manoObra": 2000,
    "aviosTotales": 40000,
    "aviosPorPrenda": 396,
    "costoUnitario": 4672,
    "costoTotalProduccion": 471872,
    "margenGanancia": 82,
    "precioSugerido": 8500,
    "precioVenta": 8500,
    "gananciaUnitaria": 3828,
    "gananciaTotal": 386628,
    "margenReal": 81.9,
    "tallerId": "tal-2",
    "tallerNombre": "Willy",
    "corteId": "corte-025",
    "telas": [
      {
        "stockKey": "stk-poplin",
        "telaNombre": "Poplin",
        "colorNombre": "Surtido",
        "unidad": "METRO",
        "rollosUsados": 2,
        "rollosDisponibles": 2,
        "rollosLibres": 0,
        "cantidadUsar": 92,
        "cantidadLibre": 0,
        "precioUnitario": 2500,
        "costoUsado": 229920
      }
    ],
    "avios": [
      {
        "id": "av-24-1",
        "nombre": "Avíos varios / Elástico",
        "monto": 396,
        "porPrenda": true
      }
    ]
  },
  {
    "id": "art-026",
    "codigoArticulo": "ART-0026",
    "nombre": "Poplin Elástico Manga",
    "descripcion": "Tela Poplin · 202 prendas",
    "cantidadPrendas": 202,
    "costoTelaTotalUsado": 459841,
    "costoTelaPorPrenda": 2276,
    "manoObra": 2000,
    "aviosTotales": 40000,
    "aviosPorPrenda": 198,
    "costoUnitario": 4474,
    "costoTotalProduccion": 903748,
    "margenGanancia": 90,
    "precioSugerido": 8500,
    "precioVenta": 8500,
    "gananciaUnitaria": 4026,
    "gananciaTotal": 813252,
    "margenReal": 90,
    "tallerId": "tal-2",
    "tallerNombre": "Willy",
    "corteId": "corte-026",
    "telas": [
      {
        "stockKey": "stk-poplin",
        "telaNombre": "Poplin",
        "colorNombre": "Surtido",
        "unidad": "METRO",
        "rollosUsados": 4,
        "rollosDisponibles": 4,
        "rollosLibres": 0,
        "cantidadUsar": 184,
        "cantidadLibre": 0,
        "precioUnitario": 2500,
        "costoUsado": 459841
      }
    ],
    "avios": [
      {
        "id": "av-25-1",
        "nombre": "Avíos varios / Elástico",
        "monto": 198,
        "porPrenda": true
      }
    ]
  },
  {
    "id": "art-027",
    "codigoArticulo": "ART-0027",
    "nombre": "Camisa Princesa",
    "descripcion": "Tela Poplin · 160 prendas",
    "cantidadPrendas": 160,
    "costoTelaTotalUsado": 661120,
    "costoTelaPorPrenda": 4132,
    "manoObra": 2000,
    "aviosTotales": 0,
    "aviosPorPrenda": 0,
    "costoUnitario": 6132,
    "costoTotalProduccion": 981120,
    "margenGanancia": 112,
    "precioSugerido": 13000,
    "precioVenta": 13000,
    "gananciaUnitaria": 6868,
    "gananciaTotal": 1098880,
    "margenReal": 112,
    "tallerId": "tal-2",
    "tallerNombre": "Willy",
    "corteId": "corte-027",
    "telas": [
      {
        "stockKey": "stk-poplin",
        "telaNombre": "Poplin",
        "colorNombre": "Surtido",
        "unidad": "METRO",
        "rollosUsados": 3,
        "rollosDisponibles": 3,
        "rollosLibres": 0,
        "cantidadUsar": 264,
        "cantidadLibre": 0,
        "precioUnitario": 2500,
        "costoUsado": 661120
      }
    ],
    "avios": []
  },
  {
    "id": "art-028",
    "codigoArticulo": "ART-0028",
    "nombre": "Camisa Poplin",
    "descripcion": "Tela Poplin · 364 prendas",
    "cantidadPrendas": 364,
    "costoTelaTotalUsado": 289584,
    "costoTelaPorPrenda": 796,
    "manoObra": 3000,
    "aviosTotales": 36400,
    "aviosPorPrenda": 100,
    "costoUnitario": 3896,
    "costoTotalProduccion": 1418144,
    "margenGanancia": 50,
    "precioSugerido": 5843,
    "precioVenta": 5843,
    "gananciaUnitaria": 1947,
    "gananciaTotal": 708708,
    "margenReal": 50,
    "tallerId": "tal-2",
    "tallerNombre": "Willy",
    "corteId": "corte-028",
    "telas": [
      {
        "stockKey": "stk-poplin",
        "telaNombre": "Poplin",
        "colorNombre": "Surtido",
        "unidad": "METRO",
        "rollosUsados": 7,
        "rollosDisponibles": 7,
        "rollosLibres": 0,
        "cantidadUsar": 116,
        "cantidadLibre": 0,
        "precioUnitario": 2500,
        "costoUsado": 289584
      }
    ],
    "avios": [
      {
        "id": "av-27-1",
        "nombre": "Avíos varios / Elástico",
        "monto": 100,
        "porPrenda": true
      }
    ]
  },
  {
    "id": "art-029",
    "codigoArticulo": "ART-0029",
    "nombre": "Musculosa Cuello Poplin",
    "descripcion": "Tela Poplin · 182 prendas",
    "cantidadPrendas": 182,
    "costoTelaTotalUsado": 72396,
    "costoTelaPorPrenda": 398,
    "manoObra": 1500,
    "aviosTotales": 0,
    "aviosPorPrenda": 0,
    "costoUnitario": 1898,
    "costoTotalProduccion": 345436,
    "margenGanancia": 50,
    "precioSugerido": 2847,
    "precioVenta": 2847,
    "gananciaUnitaria": 949,
    "gananciaTotal": 172718,
    "margenReal": 50,
    "tallerId": "tal-2",
    "tallerNombre": "Willy",
    "corteId": "corte-029",
    "telas": [
      {
        "stockKey": "stk-poplin",
        "telaNombre": "Poplin",
        "colorNombre": "Surtido",
        "unidad": "METRO",
        "rollosUsados": 4,
        "rollosDisponibles": 4,
        "rollosLibres": 0,
        "cantidadUsar": 29,
        "cantidadLibre": 0,
        "precioUnitario": 2500,
        "costoUsado": 72396
      }
    ],
    "avios": []
  },
  {
    "id": "art-030",
    "codigoArticulo": "ART-0030",
    "nombre": "Camisa Oversize",
    "descripcion": "Tela Poplin · 195 prendas",
    "cantidadPrendas": 195,
    "costoTelaTotalUsado": 267088,
    "costoTelaPorPrenda": 1370,
    "manoObra": 2700,
    "aviosTotales": 19500,
    "aviosPorPrenda": 100,
    "costoUnitario": 4170,
    "costoTotalProduccion": 813150,
    "margenGanancia": 152,
    "precioSugerido": 10500,
    "precioVenta": 10500,
    "gananciaUnitaria": 6330,
    "gananciaTotal": 1234350,
    "margenReal": 151.8,
    "tallerId": "tal-2",
    "tallerNombre": "Willy",
    "corteId": "corte-030",
    "telas": [
      {
        "stockKey": "stk-poplin",
        "telaNombre": "Poplin",
        "colorNombre": "Surtido",
        "unidad": "METRO",
        "rollosUsados": 4,
        "rollosDisponibles": 4,
        "rollosLibres": 0,
        "cantidadUsar": 107,
        "cantidadLibre": 0,
        "precioUnitario": 2500,
        "costoUsado": 267088
      }
    ],
    "avios": [
      {
        "id": "av-29-1",
        "nombre": "Avíos varios / Elástico",
        "monto": 100,
        "porPrenda": true
      }
    ]
  },
  {
    "id": "art-031",
    "codigoArticulo": "ART-0031",
    "nombre": "Camiseta Darlon",
    "descripcion": "Tela Darlon · 325 prendas",
    "cantidadPrendas": 325,
    "costoTelaTotalUsado": 1106489,
    "costoTelaPorPrenda": 3405,
    "manoObra": 1500,
    "aviosTotales": 0,
    "aviosPorPrenda": 0,
    "costoUnitario": 4905,
    "costoTotalProduccion": 1594125,
    "margenGanancia": 53,
    "precioSugerido": 7500,
    "precioVenta": 7500,
    "gananciaUnitaria": 2595,
    "gananciaTotal": 843375,
    "margenReal": 52.9,
    "tallerId": "tal-5",
    "tallerNombre": "Argentino",
    "corteId": "corte-031",
    "telas": [
      {
        "stockKey": "stk-darlon",
        "telaNombre": "Darlon",
        "colorNombre": "Surtido",
        "unidad": "KILO",
        "rollosUsados": 7,
        "rollosDisponibles": 7,
        "rollosLibres": 0,
        "cantidadUsar": 443,
        "cantidadLibre": 0,
        "precioUnitario": 2500,
        "costoUsado": 1106489
      }
    ],
    "avios": []
  },
  {
    "id": "art-032",
    "codigoArticulo": "ART-0032",
    "nombre": "Princesa Darlon",
    "descripcion": "Tela Darlon · 300 prendas",
    "cantidadPrendas": 300,
    "costoTelaTotalUsado": 1106490,
    "costoTelaPorPrenda": 3688,
    "manoObra": 1500,
    "aviosTotales": 0,
    "aviosPorPrenda": 0,
    "costoUnitario": 5188,
    "costoTotalProduccion": 1556400,
    "margenGanancia": 45,
    "precioSugerido": 7500,
    "precioVenta": 7500,
    "gananciaUnitaria": 2312,
    "gananciaTotal": 693600,
    "margenReal": 44.6,
    "tallerId": "tal-5",
    "tallerNombre": "Argentino",
    "corteId": "corte-032",
    "telas": [
      {
        "stockKey": "stk-darlon",
        "telaNombre": "Darlon",
        "colorNombre": "Surtido",
        "unidad": "KILO",
        "rollosUsados": 6,
        "rollosDisponibles": 6,
        "rollosLibres": 0,
        "cantidadUsar": 443,
        "cantidadLibre": 0,
        "precioUnitario": 2500,
        "costoUsado": 1106490
      }
    ],
    "avios": []
  },
  {
    "id": "art-033",
    "codigoArticulo": "ART-0033",
    "nombre": "Polera Darlon",
    "descripcion": "Tela Darlon · 295 prendas",
    "cantidadPrendas": 295,
    "costoTelaTotalUsado": 1106489,
    "costoTelaPorPrenda": 3751,
    "manoObra": 1500,
    "aviosTotales": 0,
    "aviosPorPrenda": 0,
    "costoUnitario": 5251,
    "costoTotalProduccion": 1549045,
    "margenGanancia": 43,
    "precioSugerido": 7500,
    "precioVenta": 7500,
    "gananciaUnitaria": 2249,
    "gananciaTotal": 663455,
    "margenReal": 42.8,
    "tallerId": "tal-5",
    "tallerNombre": "Argentino",
    "corteId": "corte-033",
    "telas": [
      {
        "stockKey": "stk-darlon",
        "telaNombre": "Darlon",
        "colorNombre": "Surtido",
        "unidad": "KILO",
        "rollosUsados": 6,
        "rollosDisponibles": 6,
        "rollosLibres": 0,
        "cantidadUsar": 443,
        "cantidadLibre": 0,
        "precioUnitario": 2500,
        "costoUsado": 1106489
      }
    ],
    "avios": []
  },
  {
    "id": "art-034",
    "codigoArticulo": "ART-0034",
    "nombre": "Pantalón Darlon",
    "descripcion": "Tela Darlon · 364 prendas",
    "cantidadPrendas": 364,
    "costoTelaTotalUsado": 1442055,
    "costoTelaPorPrenda": 3962,
    "manoObra": 3000,
    "aviosTotales": 36400,
    "aviosPorPrenda": 100,
    "costoUnitario": 7062,
    "costoTotalProduccion": 2570568,
    "margenGanancia": 56,
    "precioSugerido": 11000,
    "precioVenta": 11000,
    "gananciaUnitaria": 3938,
    "gananciaTotal": 1433432,
    "margenReal": 55.8,
    "tallerId": "tal-5",
    "tallerNombre": "Argentino",
    "corteId": "corte-034",
    "telas": [
      {
        "stockKey": "stk-darlon",
        "telaNombre": "Darlon",
        "colorNombre": "Surtido",
        "unidad": "KILO",
        "rollosUsados": 7,
        "rollosDisponibles": 7,
        "rollosLibres": 0,
        "cantidadUsar": 577,
        "cantidadLibre": 0,
        "precioUnitario": 2500,
        "costoUsado": 1442055
      }
    ],
    "avios": [
      {
        "id": "av-33-1",
        "nombre": "Avíos varios / Elástico",
        "monto": 100,
        "porPrenda": true
      }
    ]
  },
  {
    "id": "art-035",
    "codigoArticulo": "ART-0035",
    "nombre": "Musculosa Cuello Darlon",
    "descripcion": "Tela Darlon · 182 prendas",
    "cantidadPrendas": 182,
    "costoTelaTotalUsado": 360515,
    "costoTelaPorPrenda": 1981,
    "manoObra": 1500,
    "aviosTotales": 0,
    "aviosPorPrenda": 0,
    "costoUnitario": 3481,
    "costoTotalProduccion": 633542,
    "margenGanancia": -14,
    "precioSugerido": 3000,
    "precioVenta": 3000,
    "gananciaUnitaria": -481,
    "gananciaTotal": -87542,
    "margenReal": -13.8,
    "tallerId": "tal-5",
    "tallerNombre": "Argentino",
    "corteId": "corte-035",
    "telas": [
      {
        "stockKey": "stk-darlon",
        "telaNombre": "Darlon",
        "colorNombre": "Surtido",
        "unidad": "KILO",
        "rollosUsados": 4,
        "rollosDisponibles": 4,
        "rollosLibres": 0,
        "cantidadUsar": 144,
        "cantidadLibre": 0,
        "precioUnitario": 2500,
        "costoUsado": 360515
      }
    ],
    "avios": []
  },
  {
    "id": "art-036",
    "codigoArticulo": "ART-0036",
    "nombre": "Buzo Friza",
    "descripcion": "Tela Friza · 230 prendas",
    "cantidadPrendas": 230,
    "costoTelaTotalUsado": 1329600,
    "costoTelaPorPrenda": 5781,
    "manoObra": 2000,
    "aviosTotales": 0,
    "aviosPorPrenda": 0,
    "costoUnitario": 7781,
    "costoTotalProduccion": 1789630,
    "margenGanancia": 100,
    "precioSugerido": 15562,
    "precioVenta": 15562,
    "gananciaUnitaria": 7781,
    "gananciaTotal": 1789630,
    "margenReal": 100,
    "tallerId": "tal-6",
    "tallerNombre": "Joven",
    "corteId": "corte-036",
    "telas": [
      {
        "stockKey": "stk-friza",
        "telaNombre": "Friza",
        "colorNombre": "Surtido",
        "unidad": "KILO",
        "rollosUsados": 5,
        "rollosDisponibles": 5,
        "rollosLibres": 0,
        "cantidadUsar": 532,
        "cantidadLibre": 0,
        "precioUnitario": 2500,
        "costoUsado": 1329600
      }
    ],
    "avios": []
  },
  {
    "id": "art-037",
    "codigoArticulo": "ART-0037",
    "nombre": "Pantalón Friza",
    "descripcion": "Tela Friza · 174 prendas",
    "cantidadPrendas": 174,
    "costoTelaTotalUsado": 1329600,
    "costoTelaPorPrenda": 7641,
    "manoObra": 2700,
    "aviosTotales": 17400,
    "aviosPorPrenda": 100,
    "costoUnitario": 10441,
    "costoTotalProduccion": 1816734,
    "margenGanancia": 100,
    "precioSugerido": 20883,
    "precioVenta": 20883,
    "gananciaUnitaria": 10442,
    "gananciaTotal": 1816908,
    "margenReal": 100,
    "tallerId": "tal-6",
    "tallerNombre": "Joven",
    "corteId": "corte-037",
    "telas": [
      {
        "stockKey": "stk-friza",
        "telaNombre": "Friza",
        "colorNombre": "Surtido",
        "unidad": "KILO",
        "rollosUsados": 3,
        "rollosDisponibles": 3,
        "rollosLibres": 0,
        "cantidadUsar": 532,
        "cantidadLibre": 0,
        "precioUnitario": 2500,
        "costoUsado": 1329600
      }
    ],
    "avios": [
      {
        "id": "av-36-1",
        "nombre": "Avíos varios / Elástico",
        "monto": 100,
        "porPrenda": true
      }
    ]
  }
];
  var cortes = [
  {
    "id": "corte-001",
    "codigo": "C-0001",
    "fecha": "2026-08-02",
    "fechaEntregaPrometida": "2026-08-16",
    "modeloId": "art-001",
    "modeloNombre": "Short Pollera A",
    "tallerId": "tal-3",
    "tallerNombre": "Gregorio (Tío Gregorio)",
    "cantidadPrendas": 425,
    "precioPorPrenda": 3500,
    "costoTela": 761800,
    "costoManoObra": 1487500,
    "costoTotal": 2471375,
    "costoPorPrenda": 5815,
    "estado": "ENTREGADO",
    "seguimiento": {
      "enviadas": 425,
      "entregadas": 425,
      "falladas": 0
    },
    "telasUsadas": [
      {
        "id": "tuc-0-0",
        "telaId": "Sastrero",
        "telaNombre": "Sastrero",
        "colorId": "Surtido",
        "colorNombre": "Surtido",
        "rollosUsados": 9,
        "cantidadUsada": 305,
        "unidad": "KILO"
      }
    ]
  },
  {
    "id": "corte-002",
    "codigo": "C-0002",
    "fecha": "2026-08-02",
    "fechaEntregaPrometida": "2026-08-16",
    "modeloId": "art-002",
    "modeloNombre": "Short Pollera B",
    "tallerId": "tal-3",
    "tallerNombre": "Gregorio (Tío Gregorio)",
    "cantidadPrendas": 225,
    "precioPorPrenda": 3200,
    "costoTela": 444600,
    "costoManoObra": 720000,
    "costoTotal": 1278675,
    "costoPorPrenda": 5683,
    "estado": "ENTREGADO",
    "seguimiento": {
      "enviadas": 225,
      "entregadas": 225,
      "falladas": 0
    },
    "telasUsadas": [
      {
        "id": "tuc-1-0",
        "telaId": "Sastrero",
        "telaNombre": "Sastrero",
        "colorId": "Surtido",
        "colorNombre": "Surtido",
        "rollosUsados": 5,
        "cantidadUsada": 178,
        "unidad": "KILO"
      }
    ]
  },
  {
    "id": "corte-003",
    "codigo": "C-0003",
    "fecha": "2026-08-02",
    "fechaEntregaPrometida": "2026-08-16",
    "modeloId": "art-003",
    "modeloNombre": "Short Pollera 1",
    "tallerId": "tal-3",
    "tallerNombre": "Gregorio (Tío Gregorio)",
    "cantidadPrendas": 445,
    "precioPorPrenda": 3000,
    "costoTela": 761800,
    "costoManoObra": 1335000,
    "costoTotal": 2350490,
    "costoPorPrenda": 5282,
    "estado": "ENTREGADO",
    "seguimiento": {
      "enviadas": 445,
      "entregadas": 445,
      "falladas": 0
    },
    "telasUsadas": [
      {
        "id": "tuc-2-0",
        "telaId": "Sastrero",
        "telaNombre": "Sastrero",
        "colorId": "Surtido",
        "colorNombre": "Surtido",
        "rollosUsados": 9,
        "cantidadUsada": 305,
        "unidad": "KILO"
      }
    ]
  },
  {
    "id": "corte-004",
    "codigo": "C-0004",
    "fecha": "2026-08-02",
    "fechaEntregaPrometida": "2026-08-16",
    "modeloId": "art-004",
    "modeloNombre": "Short Pollera 2",
    "tallerId": "tal-3",
    "tallerNombre": "Gregorio (Tío Gregorio)",
    "cantidadPrendas": 425,
    "precioPorPrenda": 3500,
    "costoTela": 761800,
    "costoManoObra": 1487500,
    "costoTotal": 2471375,
    "costoPorPrenda": 5815,
    "estado": "ENTREGADO",
    "seguimiento": {
      "enviadas": 425,
      "entregadas": 425,
      "falladas": 0
    },
    "telasUsadas": [
      {
        "id": "tuc-3-0",
        "telaId": "Sastrero",
        "telaNombre": "Sastrero",
        "colorId": "Surtido",
        "colorNombre": "Surtido",
        "rollosUsados": 9,
        "cantidadUsada": 305,
        "unidad": "KILO"
      }
    ]
  },
  {
    "id": "corte-005",
    "codigo": "C-0005",
    "fecha": "2026-08-02",
    "fechaEntregaPrometida": "2026-08-16",
    "modeloId": "art-005",
    "modeloNombre": "Chaleco 1",
    "tallerId": "tal-3",
    "tallerNombre": "Gregorio (Tío Gregorio)",
    "cantidadPrendas": 430,
    "precioPorPrenda": 3500,
    "costoTela": 722800,
    "costoManoObra": 1505000,
    "costoTotal": 2519800,
    "costoPorPrenda": 5860,
    "estado": "ENTREGADO",
    "seguimiento": {
      "enviadas": 430,
      "entregadas": 430,
      "falladas": 0
    },
    "telasUsadas": [
      {
        "id": "tuc-4-0",
        "telaId": "Sastrero",
        "telaNombre": "Sastrero",
        "colorId": "Surtido",
        "colorNombre": "Surtido",
        "rollosUsados": 9,
        "cantidadUsada": 289,
        "unidad": "KILO"
      }
    ]
  },
  {
    "id": "corte-006",
    "codigo": "C-0006",
    "fecha": "2026-08-02",
    "fechaEntregaPrometida": "2026-08-16",
    "modeloId": "art-006",
    "modeloNombre": "Chaleco 2",
    "tallerId": "tal-3",
    "tallerNombre": "Gregorio (Tío Gregorio)",
    "cantidadPrendas": 515,
    "precioPorPrenda": 3500,
    "costoTela": 949001,
    "costoManoObra": 1802500,
    "costoTotal": 3041590,
    "costoPorPrenda": 5906,
    "estado": "ENTREGADO",
    "seguimiento": {
      "enviadas": 515,
      "entregadas": 515,
      "falladas": 0
    },
    "telasUsadas": [
      {
        "id": "tuc-5-0",
        "telaId": "Sastrero",
        "telaNombre": "Sastrero",
        "colorId": "Surtido",
        "colorNombre": "Surtido",
        "rollosUsados": 10,
        "cantidadUsada": 380,
        "unidad": "KILO"
      }
    ]
  },
  {
    "id": "corte-007",
    "codigo": "C-0007",
    "fecha": "2026-08-02",
    "fechaEntregaPrometida": "2026-08-16",
    "modeloId": "art-007",
    "modeloNombre": "Remera Morley",
    "tallerId": "tal-1",
    "tallerNombre": "Victor",
    "cantidadPrendas": 220,
    "precioPorPrenda": 1300,
    "costoTela": 384446,
    "costoManoObra": 286000,
    "costoTotal": 670340,
    "costoPorPrenda": 3047,
    "estado": "ENTREGADO",
    "seguimiento": {
      "enviadas": 220,
      "entregadas": 220,
      "falladas": 0
    },
    "telasUsadas": [
      {
        "id": "tuc-6-0",
        "telaId": "Morley",
        "telaNombre": "Morley",
        "colorId": "Surtido",
        "colorNombre": "Surtido",
        "rollosUsados": 4,
        "cantidadUsada": 154,
        "unidad": "KILO"
      }
    ]
  },
  {
    "id": "corte-008",
    "codigo": "C-0008",
    "fecha": "2026-08-02",
    "fechaEntregaPrometida": "2026-08-16",
    "modeloId": "art-008",
    "modeloNombre": "Remera Escote U",
    "tallerId": "tal-1",
    "tallerNombre": "Victor",
    "cantidadPrendas": 685,
    "precioPorPrenda": 1300,
    "costoTela": 1457749,
    "costoManoObra": 890500,
    "costoTotal": 2348180,
    "costoPorPrenda": 3428,
    "estado": "ENTREGADO",
    "seguimiento": {
      "enviadas": 685,
      "entregadas": 685,
      "falladas": 0
    },
    "telasUsadas": [
      {
        "id": "tuc-7-0",
        "telaId": "Morley",
        "telaNombre": "Morley",
        "colorId": "Surtido",
        "colorNombre": "Surtido",
        "rollosUsados": 14,
        "cantidadUsada": 583,
        "unidad": "KILO"
      }
    ]
  },
  {
    "id": "corte-009",
    "codigo": "C-0009",
    "fecha": "2026-08-02",
    "fechaEntregaPrometida": "2026-08-16",
    "modeloId": "art-009",
    "modeloNombre": "Remera Básica",
    "tallerId": "tal-1",
    "tallerNombre": "Victor",
    "cantidadPrendas": 505,
    "precioPorPrenda": 1300,
    "costoTela": 1241002,
    "costoManoObra": 656500,
    "costoTotal": 1897285,
    "costoPorPrenda": 3757,
    "estado": "ENTREGADO",
    "seguimiento": {
      "enviadas": 505,
      "entregadas": 505,
      "falladas": 0
    },
    "telasUsadas": [
      {
        "id": "tuc-8-0",
        "telaId": "Morley",
        "telaNombre": "Morley",
        "colorId": "Surtido",
        "colorNombre": "Surtido",
        "rollosUsados": 10,
        "cantidadUsada": 496,
        "unidad": "KILO"
      }
    ]
  },
  {
    "id": "corte-010",
    "codigo": "C-0010",
    "fecha": "2026-08-02",
    "fechaEntregaPrometida": "2026-08-16",
    "modeloId": "art-010",
    "modeloNombre": "Top Tu",
    "tallerId": "tal-1",
    "tallerNombre": "Victor",
    "cantidadPrendas": 93,
    "precioPorPrenda": 1000,
    "costoTela": 132975,
    "costoManoObra": 93000,
    "costoTotal": 225990,
    "costoPorPrenda": 2430,
    "estado": "ENTREGADO",
    "seguimiento": {
      "enviadas": 93,
      "entregadas": 93,
      "falladas": 0
    },
    "telasUsadas": [
      {
        "id": "tuc-9-0",
        "telaId": "Morley",
        "telaNombre": "Morley",
        "colorId": "Surtido",
        "colorNombre": "Surtido",
        "rollosUsados": 2,
        "cantidadUsada": 53,
        "unidad": "KILO"
      }
    ]
  },
  {
    "id": "corte-011",
    "codigo": "C-0011",
    "fecha": "2026-08-02",
    "fechaEntregaPrometida": "2026-08-16",
    "modeloId": "art-011",
    "modeloNombre": "Camisetas Morley Algodón",
    "tallerId": "tal-1",
    "tallerNombre": "Victor",
    "cantidadPrendas": 465,
    "precioPorPrenda": 1500,
    "costoTela": 1329751,
    "costoManoObra": 697500,
    "costoTotal": 2027400,
    "costoPorPrenda": 4360,
    "estado": "ENTREGADO",
    "seguimiento": {
      "enviadas": 465,
      "entregadas": 465,
      "falladas": 0
    },
    "telasUsadas": [
      {
        "id": "tuc-10-0",
        "telaId": "Morley",
        "telaNombre": "Morley",
        "colorId": "Surtido",
        "colorNombre": "Surtido",
        "rollosUsados": 9,
        "cantidadUsada": 532,
        "unidad": "KILO"
      }
    ]
  },
  {
    "id": "corte-012",
    "codigo": "C-0012",
    "fecha": "2026-08-02",
    "fechaEntregaPrometida": "2026-08-16",
    "modeloId": "art-012",
    "modeloNombre": "Cuello V",
    "tallerId": "tal-1",
    "tallerNombre": "Victor",
    "cantidadPrendas": 240,
    "precioPorPrenda": 1500,
    "costoTela": 739481,
    "costoManoObra": 360000,
    "costoTotal": 1144560,
    "costoPorPrenda": 4769,
    "estado": "ENTREGADO",
    "seguimiento": {
      "enviadas": 240,
      "entregadas": 240,
      "falladas": 0
    },
    "telasUsadas": [
      {
        "id": "tuc-11-0",
        "telaId": "Morley",
        "telaNombre": "Morley",
        "colorId": "Surtido",
        "colorNombre": "Surtido",
        "rollosUsados": 5,
        "cantidadUsada": 296,
        "unidad": "KILO"
      }
    ]
  },
  {
    "id": "corte-013",
    "codigo": "C-0013",
    "fecha": "2026-08-02",
    "fechaEntregaPrometida": "2026-08-16",
    "modeloId": "art-013",
    "modeloNombre": "Cuello U",
    "tallerId": "tal-1",
    "tallerNombre": "Victor",
    "cantidadPrendas": 240,
    "precioPorPrenda": 1500,
    "costoTela": 739481,
    "costoManoObra": 360000,
    "costoTotal": 1144560,
    "costoPorPrenda": 4769,
    "estado": "ENTREGADO",
    "seguimiento": {
      "enviadas": 240,
      "entregadas": 240,
      "falladas": 0
    },
    "telasUsadas": [
      {
        "id": "tuc-12-0",
        "telaId": "Morley",
        "telaNombre": "Morley",
        "colorId": "Surtido",
        "colorNombre": "Surtido",
        "rollosUsados": 5,
        "cantidadUsada": 296,
        "unidad": "KILO"
      }
    ]
  },
  {
    "id": "corte-014",
    "codigo": "C-0014",
    "fecha": "2026-08-02",
    "fechaEntregaPrometida": "2026-08-16",
    "modeloId": "art-014",
    "modeloNombre": "Blusa Cuadrado y Cuello",
    "tallerId": "tal-3",
    "tallerNombre": "Gregorio (Tío Gregorio)",
    "cantidadPrendas": 608,
    "precioPorPrenda": 1300,
    "costoTela": 1042367,
    "costoManoObra": 790400,
    "costoTotal": 1832512,
    "costoPorPrenda": 3014,
    "estado": "ENTREGADO",
    "seguimiento": {
      "enviadas": 608,
      "entregadas": 608,
      "falladas": 0
    },
    "telasUsadas": [
      {
        "id": "tuc-13-0",
        "telaId": "Melville",
        "telaNombre": "Melville",
        "colorId": "Surtido",
        "colorNombre": "Surtido",
        "rollosUsados": 12,
        "cantidadUsada": 417,
        "unidad": "KILO"
      }
    ]
  },
  {
    "id": "corte-015",
    "codigo": "C-0015",
    "fecha": "2026-08-02",
    "fechaEntregaPrometida": "2026-08-16",
    "modeloId": "art-015",
    "modeloNombre": "Blusa Cuadrado Doble Talle 2",
    "tallerId": "tal-3",
    "tallerNombre": "Gregorio (Tío Gregorio)",
    "cantidadPrendas": 130,
    "precioPorPrenda": 1000,
    "costoTela": 222875,
    "costoManoObra": 130000,
    "costoTotal": 352820,
    "costoPorPrenda": 2714,
    "estado": "ENTREGADO",
    "seguimiento": {
      "enviadas": 130,
      "entregadas": 130,
      "falladas": 0
    },
    "telasUsadas": [
      {
        "id": "tuc-14-0",
        "telaId": "Melville",
        "telaNombre": "Melville",
        "colorId": "Surtido",
        "colorNombre": "Surtido",
        "rollosUsados": 3,
        "cantidadUsada": 89,
        "unidad": "KILO"
      }
    ]
  },
  {
    "id": "corte-016",
    "codigo": "C-0016",
    "fecha": "2026-08-02",
    "fechaEntregaPrometida": "2026-08-16",
    "modeloId": "art-016",
    "modeloNombre": "Cuello Bote",
    "tallerId": "tal-3",
    "tallerNombre": "Gregorio (Tío Gregorio)",
    "cantidadPrendas": 220,
    "precioPorPrenda": 1500,
    "costoTela": 184870,
    "costoManoObra": 330000,
    "costoTotal": 514800,
    "costoPorPrenda": 2340,
    "estado": "ENTREGADO",
    "seguimiento": {
      "enviadas": 220,
      "entregadas": 220,
      "falladas": 0
    },
    "telasUsadas": [
      {
        "id": "tuc-15-0",
        "telaId": "Melville",
        "telaNombre": "Melville",
        "colorId": "Surtido",
        "colorNombre": "Surtido",
        "rollosUsados": 4,
        "cantidadUsada": 74,
        "unidad": "KILO"
      }
    ]
  },
  {
    "id": "corte-017",
    "codigo": "C-0017",
    "fecha": "2026-08-02",
    "fechaEntregaPrometida": "2026-08-16",
    "modeloId": "art-017",
    "modeloNombre": "Top Tortuga",
    "tallerId": "tal-3",
    "tallerNombre": "Gregorio (Tío Gregorio)",
    "cantidadPrendas": 120,
    "precioPorPrenda": 1300,
    "costoTela": 184870,
    "costoManoObra": 156000,
    "costoTotal": 340920,
    "costoPorPrenda": 2841,
    "estado": "ENTREGADO",
    "seguimiento": {
      "enviadas": 120,
      "entregadas": 120,
      "falladas": 0
    },
    "telasUsadas": [
      {
        "id": "tuc-16-0",
        "telaId": "Melville",
        "telaNombre": "Melville",
        "colorId": "Surtido",
        "colorNombre": "Surtido",
        "rollosUsados": 2,
        "cantidadUsada": 74,
        "unidad": "KILO"
      }
    ]
  },
  {
    "id": "corte-018",
    "codigo": "C-0018",
    "fecha": "2026-08-02",
    "fechaEntregaPrometida": "2026-08-16",
    "modeloId": "art-018",
    "modeloNombre": "Pantalón Aura 2 y 4",
    "tallerId": "tal-4",
    "tallerNombre": "Walter",
    "cantidadPrendas": 198,
    "precioPorPrenda": 2000,
    "costoTela": 578578,
    "costoManoObra": 396000,
    "costoTotal": 1014552,
    "costoPorPrenda": 5124,
    "estado": "ENTREGADO",
    "seguimiento": {
      "enviadas": 198,
      "entregadas": 198,
      "falladas": 0
    },
    "telasUsadas": [
      {
        "id": "tuc-17-0",
        "telaId": "Lino Aura",
        "telaNombre": "Lino Aura",
        "colorId": "Surtido",
        "colorNombre": "Surtido",
        "rollosUsados": 4,
        "cantidadUsada": 231,
        "unidad": "KILO"
      }
    ]
  },
  {
    "id": "corte-019",
    "codigo": "C-0019",
    "fecha": "2026-08-02",
    "fechaEntregaPrometida": "2026-08-16",
    "modeloId": "art-019",
    "modeloNombre": "Blusa Elástico T.Único",
    "tallerId": "tal-4",
    "tallerNombre": "Walter",
    "cantidadPrendas": 99,
    "precioPorPrenda": 1700,
    "costoTela": 247962,
    "costoManoObra": 168300,
    "costoTotal": 432234,
    "costoPorPrenda": 4366,
    "estado": "ENTREGADO",
    "seguimiento": {
      "enviadas": 99,
      "entregadas": 99,
      "falladas": 0
    },
    "telasUsadas": [
      {
        "id": "tuc-18-0",
        "telaId": "Lino Aura",
        "telaNombre": "Lino Aura",
        "colorId": "Surtido",
        "colorNombre": "Surtido",
        "rollosUsados": 2,
        "cantidadUsada": 99,
        "unidad": "KILO"
      }
    ]
  },
  {
    "id": "corte-020",
    "codigo": "C-0020",
    "fecha": "2026-08-02",
    "fechaEntregaPrometida": "2026-08-16",
    "modeloId": "art-020",
    "modeloNombre": "Pantalón Aura 1 y 3",
    "tallerId": "tal-4",
    "tallerNombre": "Walter",
    "cantidadPrendas": 122,
    "precioPorPrenda": 2000,
    "costoTela": 578578,
    "costoManoObra": 244000,
    "costoTotal": 862540,
    "costoPorPrenda": 7070,
    "estado": "ENTREGADO",
    "seguimiento": {
      "enviadas": 122,
      "entregadas": 122,
      "falladas": 0
    },
    "telasUsadas": [
      {
        "id": "tuc-19-0",
        "telaId": "Lino Aura",
        "telaNombre": "Lino Aura",
        "colorId": "Surtido",
        "colorNombre": "Surtido",
        "rollosUsados": 2,
        "cantidadUsada": 231,
        "unidad": "KILO"
      }
    ]
  },
  {
    "id": "corte-021",
    "codigo": "C-0021",
    "fecha": "2026-08-02",
    "fechaEntregaPrometida": "2026-08-16",
    "modeloId": "art-021",
    "modeloNombre": "Blusa Elástico T.Único 2",
    "tallerId": "tal-4",
    "tallerNombre": "Walter",
    "cantidadPrendas": 61,
    "precioPorPrenda": 1700,
    "costoTela": 165308,
    "costoManoObra": 103700,
    "costoTotal": 284992,
    "costoPorPrenda": 4672,
    "estado": "ENTREGADO",
    "seguimiento": {
      "enviadas": 61,
      "entregadas": 61,
      "falladas": 0
    },
    "telasUsadas": [
      {
        "id": "tuc-20-0",
        "telaId": "Lino Aura",
        "telaNombre": "Lino Aura",
        "colorId": "Surtido",
        "colorNombre": "Surtido",
        "rollosUsados": 1,
        "cantidadUsada": 66,
        "unidad": "KILO"
      }
    ]
  },
  {
    "id": "corte-022",
    "codigo": "C-0022",
    "fecha": "2026-08-02",
    "fechaEntregaPrometida": "2026-08-16",
    "modeloId": "art-022",
    "modeloNombre": "Short Aura 2 Volado",
    "tallerId": "tal-4",
    "tallerNombre": "Walter",
    "cantidadPrendas": 272,
    "precioPorPrenda": 2000,
    "costoTela": 874480,
    "costoManoObra": 544000,
    "costoTotal": 1458464,
    "costoPorPrenda": 5362,
    "estado": "ENTREGADO",
    "seguimiento": {
      "enviadas": 272,
      "entregadas": 272,
      "falladas": 0
    },
    "telasUsadas": [
      {
        "id": "tuc-21-0",
        "telaId": "Lino Aura",
        "telaNombre": "Lino Aura",
        "colorId": "Surtido",
        "colorNombre": "Surtido",
        "rollosUsados": 5,
        "cantidadUsada": 350,
        "unidad": "KILO"
      }
    ]
  },
  {
    "id": "corte-023",
    "codigo": "C-0023",
    "fecha": "2026-08-02",
    "fechaEntregaPrometida": "2026-08-16",
    "modeloId": "art-023",
    "modeloNombre": "Short Aura Común 1",
    "tallerId": "tal-4",
    "tallerNombre": "Walter",
    "cantidadPrendas": 300,
    "precioPorPrenda": 2000,
    "costoTela": 826539,
    "costoManoObra": 600000,
    "costoTotal": 1466400,
    "costoPorPrenda": 4888,
    "estado": "ENTREGADO",
    "seguimiento": {
      "enviadas": 300,
      "entregadas": 300,
      "falladas": 0
    },
    "telasUsadas": [
      {
        "id": "tuc-22-0",
        "telaId": "Lino Aura",
        "telaNombre": "Lino Aura",
        "colorId": "Surtido",
        "colorNombre": "Surtido",
        "rollosUsados": 6,
        "cantidadUsada": 331,
        "unidad": "KILO"
      }
    ]
  },
  {
    "id": "corte-024",
    "codigo": "C-0024",
    "fecha": "2026-08-02",
    "fechaEntregaPrometida": "2026-08-16",
    "modeloId": "art-024",
    "modeloNombre": "Camisa Lino Aura",
    "tallerId": "tal-1",
    "tallerNombre": "Victor",
    "cantidadPrendas": 517,
    "precioPorPrenda": 3000,
    "costoTela": 1688098,
    "costoManoObra": 1551000,
    "costoTotal": 3498539,
    "costoPorPrenda": 6767,
    "estado": "ENTREGADO",
    "seguimiento": {
      "enviadas": 517,
      "entregadas": 517,
      "falladas": 0
    },
    "telasUsadas": [
      {
        "id": "tuc-23-0",
        "telaId": "Lino Aura",
        "telaNombre": "Lino Aura",
        "colorId": "Surtido",
        "colorNombre": "Surtido",
        "rollosUsados": 10,
        "cantidadUsada": 675,
        "unidad": "KILO"
      }
    ]
  },
  {
    "id": "corte-025",
    "codigo": "C-0025",
    "fecha": "2026-08-02",
    "fechaEntregaPrometida": "2026-08-16",
    "modeloId": "art-025",
    "modeloNombre": "Poplin Elástico x Tu",
    "tallerId": "tal-2",
    "tallerNombre": "Willy",
    "cantidadPrendas": 101,
    "precioPorPrenda": 2000,
    "costoTela": 229920,
    "costoManoObra": 202000,
    "costoTotal": 471872,
    "costoPorPrenda": 4672,
    "estado": "ENTREGADO",
    "seguimiento": {
      "enviadas": 101,
      "entregadas": 101,
      "falladas": 0
    },
    "telasUsadas": [
      {
        "id": "tuc-24-0",
        "telaId": "Poplin",
        "telaNombre": "Poplin",
        "colorId": "Surtido",
        "colorNombre": "Surtido",
        "rollosUsados": 2,
        "cantidadUsada": 92,
        "unidad": "METRO"
      }
    ]
  },
  {
    "id": "corte-026",
    "codigo": "C-0026",
    "fecha": "2026-08-02",
    "fechaEntregaPrometida": "2026-08-16",
    "modeloId": "art-026",
    "modeloNombre": "Poplin Elástico Manga",
    "tallerId": "tal-2",
    "tallerNombre": "Willy",
    "cantidadPrendas": 202,
    "precioPorPrenda": 2000,
    "costoTela": 459841,
    "costoManoObra": 404000,
    "costoTotal": 903748,
    "costoPorPrenda": 4474,
    "estado": "ENTREGADO",
    "seguimiento": {
      "enviadas": 202,
      "entregadas": 202,
      "falladas": 0
    },
    "telasUsadas": [
      {
        "id": "tuc-25-0",
        "telaId": "Poplin",
        "telaNombre": "Poplin",
        "colorId": "Surtido",
        "colorNombre": "Surtido",
        "rollosUsados": 4,
        "cantidadUsada": 184,
        "unidad": "METRO"
      }
    ]
  },
  {
    "id": "corte-027",
    "codigo": "C-0027",
    "fecha": "2026-08-02",
    "fechaEntregaPrometida": "2026-08-16",
    "modeloId": "art-027",
    "modeloNombre": "Camisa Princesa",
    "tallerId": "tal-2",
    "tallerNombre": "Willy",
    "cantidadPrendas": 160,
    "precioPorPrenda": 2000,
    "costoTela": 661120,
    "costoManoObra": 320000,
    "costoTotal": 981120,
    "costoPorPrenda": 6132,
    "estado": "ENTREGADO",
    "seguimiento": {
      "enviadas": 160,
      "entregadas": 160,
      "falladas": 0
    },
    "telasUsadas": [
      {
        "id": "tuc-26-0",
        "telaId": "Poplin",
        "telaNombre": "Poplin",
        "colorId": "Surtido",
        "colorNombre": "Surtido",
        "rollosUsados": 3,
        "cantidadUsada": 264,
        "unidad": "METRO"
      }
    ]
  },
  {
    "id": "corte-028",
    "codigo": "C-0028",
    "fecha": "2026-08-02",
    "fechaEntregaPrometida": "2026-08-16",
    "modeloId": "art-028",
    "modeloNombre": "Camisa Poplin",
    "tallerId": "tal-2",
    "tallerNombre": "Willy",
    "cantidadPrendas": 364,
    "precioPorPrenda": 3000,
    "costoTela": 289584,
    "costoManoObra": 1092000,
    "costoTotal": 1418144,
    "costoPorPrenda": 3896,
    "estado": "ENTREGADO",
    "seguimiento": {
      "enviadas": 364,
      "entregadas": 364,
      "falladas": 0
    },
    "telasUsadas": [
      {
        "id": "tuc-27-0",
        "telaId": "Poplin",
        "telaNombre": "Poplin",
        "colorId": "Surtido",
        "colorNombre": "Surtido",
        "rollosUsados": 7,
        "cantidadUsada": 116,
        "unidad": "METRO"
      }
    ]
  },
  {
    "id": "corte-029",
    "codigo": "C-0029",
    "fecha": "2026-08-02",
    "fechaEntregaPrometida": "2026-08-16",
    "modeloId": "art-029",
    "modeloNombre": "Musculosa Cuello Poplin",
    "tallerId": "tal-2",
    "tallerNombre": "Willy",
    "cantidadPrendas": 182,
    "precioPorPrenda": 1500,
    "costoTela": 72396,
    "costoManoObra": 273000,
    "costoTotal": 345436,
    "costoPorPrenda": 1898,
    "estado": "ENTREGADO",
    "seguimiento": {
      "enviadas": 182,
      "entregadas": 182,
      "falladas": 0
    },
    "telasUsadas": [
      {
        "id": "tuc-28-0",
        "telaId": "Poplin",
        "telaNombre": "Poplin",
        "colorId": "Surtido",
        "colorNombre": "Surtido",
        "rollosUsados": 4,
        "cantidadUsada": 29,
        "unidad": "METRO"
      }
    ]
  },
  {
    "id": "corte-030",
    "codigo": "C-0030",
    "fecha": "2026-08-02",
    "fechaEntregaPrometida": "2026-08-16",
    "modeloId": "art-030",
    "modeloNombre": "Camisa Oversize",
    "tallerId": "tal-2",
    "tallerNombre": "Willy",
    "cantidadPrendas": 195,
    "precioPorPrenda": 2700,
    "costoTela": 267088,
    "costoManoObra": 526500,
    "costoTotal": 813150,
    "costoPorPrenda": 4170,
    "estado": "ENTREGADO",
    "seguimiento": {
      "enviadas": 195,
      "entregadas": 195,
      "falladas": 0
    },
    "telasUsadas": [
      {
        "id": "tuc-29-0",
        "telaId": "Poplin",
        "telaNombre": "Poplin",
        "colorId": "Surtido",
        "colorNombre": "Surtido",
        "rollosUsados": 4,
        "cantidadUsada": 107,
        "unidad": "METRO"
      }
    ]
  },
  {
    "id": "corte-031",
    "codigo": "C-0031",
    "fecha": "2026-08-02",
    "fechaEntregaPrometida": "2026-08-16",
    "modeloId": "art-031",
    "modeloNombre": "Camiseta Darlon",
    "tallerId": "tal-5",
    "tallerNombre": "Argentino",
    "cantidadPrendas": 325,
    "precioPorPrenda": 1500,
    "costoTela": 1106489,
    "costoManoObra": 487500,
    "costoTotal": 1594125,
    "costoPorPrenda": 4905,
    "estado": "ENTREGADO",
    "seguimiento": {
      "enviadas": 325,
      "entregadas": 325,
      "falladas": 0
    },
    "telasUsadas": [
      {
        "id": "tuc-30-0",
        "telaId": "Darlon",
        "telaNombre": "Darlon",
        "colorId": "Surtido",
        "colorNombre": "Surtido",
        "rollosUsados": 7,
        "cantidadUsada": 443,
        "unidad": "KILO"
      }
    ]
  },
  {
    "id": "corte-032",
    "codigo": "C-0032",
    "fecha": "2026-08-02",
    "fechaEntregaPrometida": "2026-08-16",
    "modeloId": "art-032",
    "modeloNombre": "Princesa Darlon",
    "tallerId": "tal-5",
    "tallerNombre": "Argentino",
    "cantidadPrendas": 300,
    "precioPorPrenda": 1500,
    "costoTela": 1106490,
    "costoManoObra": 450000,
    "costoTotal": 1556400,
    "costoPorPrenda": 5188,
    "estado": "ENTREGADO",
    "seguimiento": {
      "enviadas": 300,
      "entregadas": 300,
      "falladas": 0
    },
    "telasUsadas": [
      {
        "id": "tuc-31-0",
        "telaId": "Darlon",
        "telaNombre": "Darlon",
        "colorId": "Surtido",
        "colorNombre": "Surtido",
        "rollosUsados": 6,
        "cantidadUsada": 443,
        "unidad": "KILO"
      }
    ]
  },
  {
    "id": "corte-033",
    "codigo": "C-0033",
    "fecha": "2026-08-02",
    "fechaEntregaPrometida": "2026-08-16",
    "modeloId": "art-033",
    "modeloNombre": "Polera Darlon",
    "tallerId": "tal-5",
    "tallerNombre": "Argentino",
    "cantidadPrendas": 295,
    "precioPorPrenda": 1500,
    "costoTela": 1106489,
    "costoManoObra": 442500,
    "costoTotal": 1549045,
    "costoPorPrenda": 5251,
    "estado": "ENTREGADO",
    "seguimiento": {
      "enviadas": 295,
      "entregadas": 295,
      "falladas": 0
    },
    "telasUsadas": [
      {
        "id": "tuc-32-0",
        "telaId": "Darlon",
        "telaNombre": "Darlon",
        "colorId": "Surtido",
        "colorNombre": "Surtido",
        "rollosUsados": 6,
        "cantidadUsada": 443,
        "unidad": "KILO"
      }
    ]
  },
  {
    "id": "corte-034",
    "codigo": "C-0034",
    "fecha": "2026-08-02",
    "fechaEntregaPrometida": "2026-08-16",
    "modeloId": "art-034",
    "modeloNombre": "Pantalón Darlon",
    "tallerId": "tal-5",
    "tallerNombre": "Argentino",
    "cantidadPrendas": 364,
    "precioPorPrenda": 3000,
    "costoTela": 1442055,
    "costoManoObra": 1092000,
    "costoTotal": 2570568,
    "costoPorPrenda": 7062,
    "estado": "ENTREGADO",
    "seguimiento": {
      "enviadas": 364,
      "entregadas": 364,
      "falladas": 0
    },
    "telasUsadas": [
      {
        "id": "tuc-33-0",
        "telaId": "Darlon",
        "telaNombre": "Darlon",
        "colorId": "Surtido",
        "colorNombre": "Surtido",
        "rollosUsados": 7,
        "cantidadUsada": 577,
        "unidad": "KILO"
      }
    ]
  },
  {
    "id": "corte-035",
    "codigo": "C-0035",
    "fecha": "2026-08-02",
    "fechaEntregaPrometida": "2026-08-16",
    "modeloId": "art-035",
    "modeloNombre": "Musculosa Cuello Darlon",
    "tallerId": "tal-5",
    "tallerNombre": "Argentino",
    "cantidadPrendas": 182,
    "precioPorPrenda": 1500,
    "costoTela": 360515,
    "costoManoObra": 273000,
    "costoTotal": 633542,
    "costoPorPrenda": 3481,
    "estado": "ENTREGADO",
    "seguimiento": {
      "enviadas": 182,
      "entregadas": 182,
      "falladas": 0
    },
    "telasUsadas": [
      {
        "id": "tuc-34-0",
        "telaId": "Darlon",
        "telaNombre": "Darlon",
        "colorId": "Surtido",
        "colorNombre": "Surtido",
        "rollosUsados": 4,
        "cantidadUsada": 144,
        "unidad": "KILO"
      }
    ]
  },
  {
    "id": "corte-036",
    "codigo": "C-0036",
    "fecha": "2026-08-02",
    "fechaEntregaPrometida": "2026-08-16",
    "modeloId": "art-036",
    "modeloNombre": "Buzo Friza",
    "tallerId": "tal-6",
    "tallerNombre": "Joven",
    "cantidadPrendas": 230,
    "precioPorPrenda": 2000,
    "costoTela": 1329600,
    "costoManoObra": 460000,
    "costoTotal": 1789630,
    "costoPorPrenda": 7781,
    "estado": "ENTREGADO",
    "seguimiento": {
      "enviadas": 230,
      "entregadas": 230,
      "falladas": 0
    },
    "telasUsadas": [
      {
        "id": "tuc-35-0",
        "telaId": "Friza",
        "telaNombre": "Friza",
        "colorId": "Surtido",
        "colorNombre": "Surtido",
        "rollosUsados": 5,
        "cantidadUsada": 532,
        "unidad": "KILO"
      }
    ]
  },
  {
    "id": "corte-037",
    "codigo": "C-0037",
    "fecha": "2026-08-02",
    "fechaEntregaPrometida": "2026-08-16",
    "modeloId": "art-037",
    "modeloNombre": "Pantalón Friza",
    "tallerId": "tal-6",
    "tallerNombre": "Joven",
    "cantidadPrendas": 174,
    "precioPorPrenda": 2700,
    "costoTela": 1329600,
    "costoManoObra": 469800,
    "costoTotal": 1816734,
    "costoPorPrenda": 10441,
    "estado": "ENTREGADO",
    "seguimiento": {
      "enviadas": 174,
      "entregadas": 174,
      "falladas": 0
    },
    "telasUsadas": [
      {
        "id": "tuc-36-0",
        "telaId": "Friza",
        "telaNombre": "Friza",
        "colorId": "Surtido",
        "colorNombre": "Surtido",
        "rollosUsados": 3,
        "cantidadUsada": 532,
        "unidad": "KILO"
      }
    ]
  }
];

  Logger.log('Iniciando carga de talleres...');
  talleres.forEach(function(t) {
    upsertFila(SHEETS.TALLERES, t);
  });

  Logger.log('Iniciando carga de proveedores...');
  proveedores.forEach(function(p) {
    upsertFila(SHEETS.PROVEEDORES, p);
  });

  Logger.log('Iniciando carga de compras y telas...');
  compras.forEach(function(c) {
    upsertFila(SHEETS.COMPRAS, c);
  });

  Logger.log('Iniciando carga de artículos (37 prendas)...');
  articulos.forEach(function(a) {
    upsertFila(SHEETS.ARTICULOS, a);
  });

  Logger.log('Iniciando carga de cortes de confección...');
  cortes.forEach(function(c) {
    upsertFila(SHEETS.CORTES, c);
  });

  Logger.log('¡Carga completa! Se cargaron ' + articulos.length + ' artículos y ' + compras.length + ' compras.');
}
