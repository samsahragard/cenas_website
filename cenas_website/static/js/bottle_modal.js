/* =========================================================================
   Cenas bottle descriptions + click-to-view modal.
   --> TO EDIT: change the text after each filename below. The // comment
       shows which bottle it is. Leave the filename keys alone.
   ========================================================================= */
const BOTTLE_INFO = {
  "whitewine_kendall_jackson_chardonnay.png": "Wine > White Wine > Chardonnay; Region: California; Country: United States",  // Kendall-Jackson Chardonnay
  "whitewine_ecco_domani_pinot_grigio.png": "Wine > White Wine > Pinot Gris/Grigio; Appellation: Delle Venezie; Region: Veneto; Country: Italy",  // Ecco Domani Pinot Grigio
  "whitewine_sutter_home_white_zinfandel.png": "Wine > Rose Wine > White Zinfandel; Region: California; Country: United States; ABV: 9.5%",  // Sutter Home White Zinfandel
  "redwine_mark_west_pinot_noir.png": "Wine > Red Wine > Pinot Noir; Region: California; Country: United States; ABV: 14%",  // Mark West Pinot Noir
  "redwine_woodbridge_merlot.png": "Wine > Red Wine > Merlot; Region: California; Country: United States",  // Woodbridge Merlot
  "redwine_kendall_jackson_cabernet.png": "Kendall-Jackson Vintner's Reserve Cabernet Sauvignon - a California red wine selection.",  // Kendall-Jackson Cabernet
  "beer_budweiser.png": "Beer & Hard Seltzer > Lager > Pale Lager; Region: Missouri; Country: United States; ABV: 4.2%",  // Budweiser
  "beer_bud_light.png": "Beer & Hard Seltzer > Lager > Light Lager; Region: Missouri; Country: United States; ABV: 4.2%",  // Bud Light
  "beer_coors_light.png": "Beer & Hard Seltzer > Lager > Light Lager; Region: Colorado; Country: United States; ABV: 4.2%",  // Coors Light
  "beer_miller_lite.png": "Beer & Hard Seltzer > Lager > Light Lager; Country: United States; ABV: 4.2%",  // Miller Lite
  "beer_michelob_ultra.png": "Beer & Hard Seltzer > Lager > Light Lager; Region: Missouri; Country: United States; ABV: 4.2%",  // Michelob Ultra
  "beer_shiner_bock.png": "Beer & Hard Seltzer > Lager > Bock; Region: Texas; Country: United States; ABV: 4.4%",  // Shiner Bock
  "beer_corona_extra.png": "Corona Extra - a crisp Mexican-style lager served ice-cold.",  // Corona Extra
  "beer_dos_xx_lager.png": "Beer & Hard Seltzer > Lager > Mexican Style; Country: Mexico; ABV: 4.2%",  // Dos XX Lager (Dos Equis)
  "beer_modelo_especial.png": "Beer & Hard Seltzer > Lager > Mexican Style; Country: Mexico; ABV: 4.4%",  // Modelo Especial
  "beer_modelo_negra.png": "Beer & Hard Seltzer > Lager > Amber Lager; Country: Mexico; ABV: 5.4%",  // Negra Modelo
  "beer_pacifico.png": "Beer & Hard Seltzer > Lager > Mexican Style; Country: Mexico; ABV: 4.5%",  // Pacifico
  "beer_tecate_original.png": "Beer & Hard Seltzer > Lager > Mexican Style; Country: Mexico; ABV: 4.5%",  // Tecate Original
  "bourbon_jim_beam.png": "Spirits > Whiskey > Bourbon Whiskey; Region: Kentucky; Country: United States; ABV: 40%",  // Jim Beam
  "bourbon_makers_mark.png": "Spirits > Whiskey > Bourbon Whiskey; Country: United States; ABV: 45%",  // Maker's Mark
  "bourbon_old_forester_86.png": "Spirits > Whiskey > Bourbon Whiskey; Region: Kentucky; Country: United States; ABV: 43%",  // Old Forester 86
  "bourbon_old_forester_1920.png": "Spirits > Whiskey > Bourbon Whiskey; Region: Kentucky; Country: United States",  // Old Forester 1920
  "bourbon_woodford_reserve.png": "Spirits > Whiskey > Bourbon Whiskey; Region: Kentucky; Country: United States; ABV: 45.2%",  // Woodford Reserve
  "bourbon_knob_creek.png": "Spirits > Whiskey > Bourbon Whiskey; Region: Kentucky; Country: United States; ABV: 50%",  // Knob Creek
  "bourbon_wild_turkey_101.png": "Spirits > Whiskey > Bourbon Whiskey; Region: Kentucky; Country: United States; ABV: 50.5%",  // Wild Turkey 101
  "bourbon_blantons.png": "Spirits > Whiskey > Bourbon Whiskey; Country: United States; ABV: 46.5%",  // Blanton's
  "bourbon_jameson.png": "Spirits > Whiskey > Irish Whiskey; Country: Ireland; ABV: 40%",  // Jameson
  "bourbon_crown_royal.png": "Spirits > Whiskey > Canadian Whisky; Region: Ontario; Country: Canada; ABV: 40%",  // Crown Royal
  "bourbon_jack_daniels.png": "Jack Daniel's Old No. 7 Tennessee Whiskey - classic Tennessee whiskey for neat pours, rocks, or cocktails.",  // Jack Daniel's
  "bourbon_dewars.png": "Spirits > Whiskey > Scotch Whisky; Country: Scotland; ABV: 40%",  // Dewar's
  "bourbon_johnnie_walker_black.png": "Spirits > Whiskey > Scotch Whisky; Country: Scotland; ABV: 40%",  // Johnnie Walker Black
  "bourbon_johnnie_walker_blue.png": "Spirits > Whiskey > Scotch Whisky; Country: Scotland; ABV: 40%",  // Johnnie Walker Blue
  "bourbon_glenlivet.png": "Spirits > Whiskey > Scotch Whisky; Country: Scotland; ABV: 40%",  // Glenlivet 12yr
  "bourbon_macallan_12yr.png": "Spirits > Whiskey > Scotch Whisky; Region: Highland; Country: Scotland; ABV: 43%",  // Macallan 12yr
  "bourbon_angels_envy_rye.png": "Spirits > Whiskey > Rye Whiskey; Region: Kentucky; Country: United States; ABV: 50%",  // Angel's Envy Rye
  "bourbon_whistlepig_rye.png": "Spirits > Whiskey > Rye Whiskey; Region: Vermont; Country: United States; ABV: 50%",  // WhistlePig Rye
  "vodka_titos.png": "Spirits > Vodka > Plain Vodka; Region: Texas; Country: United States; ABV: 40%",  // Tito's
  "vodka_grey_goose.png": "Spirits > Vodka > Plain Vodka; Country: France; ABV: 40%",  // Grey Goose
  "vodka_ketel_one.png": "Spirits > Vodka > Plain Vodka; Country: Netherlands; ABV: 40%",  // Ketel One
  "vodka_absolut.png": "Spirits > Vodka > Plain Vodka; Country: Sweden; ABV: 40%",  // Absolut
  "rum_bacardi.png": "Spirits > Rum > White Rum; Country: Puerto Rico; ABV: 40%",  // Bacardi
  "rum_captain_morgan.png": "Spirits > Rum > Spiced Rum; Country: United States; ABV: 35%",  // Captain Morgan
  "rum_cruzan_dark.png": "Spirits > Rum > Aged Rum; Region: Saint Croix; Country: Virgin Islands",  // Cruzan Dark
  "rum_cruzan_light.png": "Spirits > Rum > Aged Rum; Region: Saint Croix; Country: Virgin Islands; ABV: 40%",  // Cruzan Light
  "rum_malibu.png": "Spirits > Rum > Flavored Rum; Country: Canada; ABV: 21%",  // Malibu
  "rum_diplomatico.png": "Spirits > Rum > Dark Rum; Country: Venezuela; ABV: 40%",  // Diplomático
  "gin_tanqueray.png": "Spirits > Gin > London Dry Gin; Country: England; ABV: 47.3%",  // Tanqueray
  "gin_bombay_sapphire.png": "Spirits > Gin > London Dry Gin; Country: England; ABV: 47%",  // Bombay Sapphire
  "gin_gunpowder.png": "Spirits > Gin > International Style Gin; Country: Ireland; ABV: 43%",  // Gunpowder
  "blanco_1800.png": "1800 Tequila Blanco - a clean blanco tequila selection from Jalisco.",  // 1800 Silver
  "blanco_altos.png": "Spirits > Tequila > Blanco; Appellation: Tequila 100% de Agave; Region: Jalisco; Country: Mexico; ABV: 40%",  // Altos Plata
  "blanco_casamigos.png": "Spirits > Tequila > Blanco; Appellation: Tequila 100% de Agave; Region: Jalisco; Country: Mexico; ABV: 40%",  // Casamigos Blanco
  "blanco_cimarron.png": "Spirits > Tequila > Blanco; Appellation: Tequila 100% de Agave; Region: Jalisco; Country: Mexico",  // Cimarrón
  "blanco_don_julio.png": "Spirits > Tequila > Blanco; Appellation: Tequila 100% de Agave; Region: Jalisco; Country: Mexico; ABV: 40%",  // Don Julio Blanco
  "blanco_espolon.png": "Spirits > Tequila > Blanco; Appellation: Tequila 100% de Agave; Region: Jalisco; Country: Mexico; ABV: 40%",  // Espolòn
  "blanco_exotico.png": "Spirits > Tequila > Blanco; Appellation: Tequila 100% de Agave; Region: Jalisco; Country: Mexico; ABV: 40%",  // Exótico
  "blanco_herradura.png": "Herradura Silver - a bright blanco tequila selection from Jalisco.",  // Herradura Silver
  "blanco_jose_cuervo.png": "Spirits > Tequila > Blanco; Region: Jalisco; Country: Mexico; ABV: 40%",  // Jose Cuervo Silver
  "blanco_lalo.png": "Spirits > Tequila > Blanco; Region: Jalisco; Country: Mexico; ABV: 40%",  // Lalo
  "blanco_maestro_dobel.png": "Spirits > Tequila > Blanco; Appellation: Tequila 100% de Agave; Region: Jalisco; Country: Mexico; ABV: 40%",  // Maestro Dobel Blanco
  "blanco_patron.png": "Spirits > Tequila > Blanco; Appellation: Tequila 100% de Agave; Region: Jalisco; Country: Mexico; ABV: 40%",  // Patrón Silver
  "blanco_skelly.png": "Spirits > Tequila > Blanco; Appellation: Tequila 100% de Agave; Region: Jalisco; Country: Mexico; ABV: 40%",  // Skelly
  "reposado_1800.png": "Spirits > Tequila > Reposado; Appellation: Tequila 100% de Agave; Region: Jalisco; Country: Mexico; ABV: 40%",  // 1800
  "reposado_altos.png": "Spirits > Tequila > Reposado; Appellation: Tequila 100% de Agave; Region: Jalisco; Country: Mexico; ABV: 40%",  // Altos
  "reposado_casamigos.png": "Spirits > Tequila > Reposado; Appellation: Tequila 100% de Agave; Region: Jalisco; Country: Mexico; ABV: 40%",  // Casamigos
  "reposado_don_julio.png": "Spirits > Tequila > Reposado; Appellation: Tequila 100% de Agave; Region: Jalisco; Country: Mexico; ABV: 40%",  // Don Julio
  "reposado_gema_iguana.png": "Spirits > Tequila > Reposado; Country: Mexico; ABV: 40%",  // Gema Iguana
  "reposado_herradura.png": "Spirits > Tequila > Reposado; Appellation: Tequila 100% de Agave; Region: Jalisco; Country: Mexico; ABV: 40%",  // Herradura
  "reposado_jose_cuervo_gold.png": "Spirits > Tequila > Gold; Region: Jalisco; Country: Mexico; ABV: 40%",  // Jose Cuervo Gold
  "reposado_la_gritona.png": "Spirits > Tequila > Reposado; Appellation: Tequila 100% de Agave; Region: Jalisco; Country: Mexico; ABV: 40%",  // La Gritona
  "reposado_milagro.png": "Spirits > Tequila > Reposado; Appellation: Tequila 100% de Agave; Region: Jalisco; Country: Mexico; ABV: 40%",  // Milagro
  "reposado_patron.png": "Spirits > Tequila > Reposado; Appellation: Tequila 100% de Agave; Region: Jalisco; Country: Mexico; ABV: 40%",  // Patrón
  "anejo_1800.png": "Spirits > Tequila > Anejo; Appellation: Tequila 100% de Agave; Region: Jalisco; Country: Mexico; ABV: 40%",  // 1800
  "anejo_casamigos.png": "Spirits > Tequila > Anejo; Appellation: Tequila 100% de Agave; Region: Jalisco; Country: Mexico; ABV: 40%",  // Casamigos
  "anejo_don_julio.png": "Spirits > Tequila > Anejo; Appellation: Tequila 100% de Agave; Region: Jalisco; Country: Mexico; ABV: 40%",  // Don Julio
  "anejo_herradura.png": "Spirits > Tequila > Anejo; Appellation: Tequila 100% de Agave; Region: Jalisco; Country: Mexico; ABV: 40%",  // Herradura
  "anejo_milagro.png": "Spirits > Tequila > Anejo; Appellation: Tequila 100% de Agave; Region: Jalisco; Country: Mexico; ABV: 40%",  // Milagro
  "anejo_patron.png": "Spirits > Tequila > Anejo; Appellation: Tequila 100% de Agave; Region: Jalisco; Country: Mexico; ABV: 40%",  // Patrón
  "cristalino_1800_cristalino.png": "Spirits > Tequila > Cristalino; Appellation: Tequila 100% de Agave; Region: Jalisco; Country: Mexico; ABV: 40%",  // 1800 Cristalino
  "cristalino_carinosa_rosa_blanco.png": "Spirits > Tequila > Blanco; Appellation: Tequila 100% de Agave; Region: Jalisco; Country: Mexico; ABV: 40%",  // Calirosa Rosa Blanco
  "cristalino_casamigos_cristalino.png": "Spirits > Tequila > Reposado; Appellation: Tequila 100% de Agave; Region: Jalisco; Country: Mexico; ABV: 40%",  // Casamigos Cristalino
  "cristalino_don_julio_70_cristalino.png": "Spirits > Tequila > Cristalino; Appellation: Tequila 100% de Agave; Region: Jalisco; Country: Mexico; ABV: 40%",  // Don Julio 70 Cristalino
  "cristalino_hornitos_black_barrel.png": "Spirits > Tequila > Anejo; Appellation: Tequila 100% de Agave; Region: Jalisco; Country: Mexico; ABV: 40%",  // Hornitos Black Barrel
  "cristalino_maestro_dobel_diamante.png": "Spirits > Tequila > Cristalino; Appellation: Tequila 100% de Agave; Region: Jalisco; Country: Mexico; ABV: 40%",  // Maestro Dobel Diamante
  "infused_21_seeds_cucumber_jalapeno.png": "Spirits > Tequila > Flavored Tequila; Region: Jalisco; Country: Mexico; ABV: 35%",  // 21 Seeds Cucumber Jalapeño
  "infused_21_seeds_grapefruit_hibiscus.png": "Spirits > Tequila > Flavored Tequila; Region: Jalisco; Country: Mexico; ABV: 35%",  // 21 Seeds Grapefruit Hibiscus
  "infused_21_seeds_valencia_orange.png": "Spirits > Tequila > Flavored Tequila; Region: Jalisco; Country: Mexico; ABV: 35%",  // 21 Seeds Valencia Orange
  "mezcal_casamigos.png": "Spirits > Mezcal > Mezcal; Appellation: Mezcal Artesanal; Region: Oaxaca; Country: Mexico; ABV: 40%",  // Casamigos Mezcal
  "mezcal_del_maguey_vida.png": "Spirits > Mezcal > Mezcal; Appellation: Mezcal Artesanal; Region: Oaxaca; Country: Mexico",  // Del Maguey Vida
  "mezcal_dessert_door.png": "Spirits > Tequila > Sotol; Region: Texas; Country: United States; ABV: 40%",  // Desert Door
  "mezcal_marca_negra.png": "Spirits > Mezcal > Mezcal; Region: Oaxaca; Country: Mexico",  // Marca Negra
  "mezcal_montelobos.png": "Spirits > Mezcal > Mezcal; Appellation: Mezcal Artesanal; Region: Oaxaca; Country: Mexico; ABV: 43.2%",  // Montelobos
  "premium_don_julio_ultima_reserva.png": "Spirits > Tequila > Extra Anejo; Appellation: Tequila 100% de Agave; Region: Jalisco; Country: Mexico; ABV: 40%",  // Don Julio Última Reserva
  "premium_don_julio_1942.png": "Spirits > Tequila > Anejo; Appellation: Tequila 100% de Agave; Region: Jalisco; Country: Mexico; ABV: 40%",  // Don Julio 1942
  "premium_mandala_extra_anejo.png": "Spirits > Tequila > Extra Anejo; Region: Jalisco; Country: Mexico",  // Mandala Extra Añejo
  "premium_dos_artes_plata.png": "Spirits > Tequila > Blanco; Country: Mexico; ABV: 40%",  // Dos Artes Plata
  "premium_chaquira_extra_anejo.png": "Spirits > Tequila > Extra Anejo; Appellation: Tequila 100% de Agave; Region: Jalisco; Country: Mexico; ABV: 40%",  // Chaquira Extra Añejo
  "premium_kah_extra_anejo.png": "Spirits > Tequila > Extra Anejo; Country: Mexico; ABV: 40%",  // Kah Extra Añejo
  "premium_eight_reserve_anejo.png": "Spirits > Tequila > Anejo; Appellation: Tequila 100% de Agave; Region: Jalisco; Country: Mexico; ABV: 40%",  // Eight Reserve Añejo
  "premium_serpiente_blanco.png": "Spirits > Tequila > Blanco; ABV: 40%",  // Serpiente Blanco
  "premium_fosforo_mezcal.png": "Spirits > Mezcal > Joven; Region: Puebla; Country: Mexico",  // Fósforo Mezcal
  "premium_mandala_blanco.png": "Spirits > Tequila > Blanco; Appellation: Tequila 100% de Agave; Region: Jalisco; Country: Mexico; ABV: 40%",  // Mandala Blanco
  "premium_soledad_joven.png": "Spirits > Tequila > Joven Tequila; Appellation: Tequila 100% de Agave; Region: Jalisco; Country: Mexico; ABV: 40%",  // Soledad Joven
  "premium_clase_azul_plata.png": "Spirits > Tequila > Blanco; Appellation: Tequila 100% de Agave; Region: Jalisco; Country: Mexico; ABV: 40%",  // Clase Azul Plata
  "premium_clase_azul_gold.png": "Spirits > Tequila > Gold; Appellation: Tequila 100% de Agave; Region: Jalisco; Country: Mexico; ABV: 40%",  // Clase Azul Gold
  "premium_clase_azul_reposado.png": "Spirits > Tequila > Reposado; Appellation: Tequila 100% de Agave; Region: Jalisco; Country: Mexico; ABV: 40%",  // Clase Azul Reposado
  "premium_clase_azul_anejo.png": "Spirits > Tequila > Anejo; Country: Mexico",  // Clase Azul Añejo
  "premium_clase_azul_guerrero_mezcal.png": "Spirits > Mezcal > Mezcal; Country: Mexico",  // Clase Azul Guerrero Mezcal
  "beer_non_alcoholic_corona.png": "Non-Alcoholic Corona - crisp Corona taste with no alcohol.",  // Non-Alcoholic Corona
};

(function () {
  function descFor(srcAttr) {
    if (!srcAttr) return "Tasting notes coming soon.";
    var file = srcAttr.split("/").pop().split("?")[0];
    return BOTTLE_INFO[file] || "Tasting notes coming soon.";
  }

  // Build the modal once
  var modal = document.createElement("div");
  modal.className = "bmodal";
  modal.id = "bottleModal";
  modal.innerHTML =
    '<div class="bmodal-backdrop"></div>' +
    '<div class="bmodal-card" role="dialog" aria-modal="true">' +
      '<button class="bmodal-close" aria-label="Close">&times;</button>' +
      '<div class="bmodal-img"><img alt=""></div>' +
      '<div class="bmodal-body">' +
        '<h4 class="bmodal-name"></h4>' +
        '<p class="bmodal-cat"></p>' +
        '<p class="bmodal-desc"></p>' +
      '</div>' +
    '</div>';
  document.body.appendChild(modal);

  var mImg = modal.querySelector(".bmodal-img img");
  var mName = modal.querySelector(".bmodal-name");
  var mCat = modal.querySelector(".bmodal-cat");
  var mDesc = modal.querySelector(".bmodal-desc");

  function openModal(item) {
    var img = item.querySelector("img.mbottle");
    var nameEl = item.querySelector(".nm");
    var name = nameEl ? nameEl.textContent.trim() : "";
    var grp = item.closest(".menu-group");
    var h3 = grp ? grp.querySelector("h3") : null;
    mImg.src = img ? img.src : "";
    mImg.alt = name;
    mName.textContent = name;
    mCat.textContent = h3 ? h3.textContent.trim() : "";
    mDesc.textContent = descFor(img ? img.getAttribute("src") : "");
    modal.classList.add("open");
    document.body.style.overflow = "hidden";
  }
  function closeModal() {
    modal.classList.remove("open");
    document.body.style.overflow = "";
  }

  function wire() {
    var items = document.querySelectorAll(".mitem");
    for (var i = 0; i < items.length; i++) {
      var it = items[i];
      if (it.querySelector("img.mbottle") && !it.dataset.bwired) {
        it.dataset.bwired = "1";
        it.classList.add("bottle-clickable");
        (function (el) {
          el.addEventListener("click", function () { openModal(el); });
        })(it);
      }
    }
  }

  function init() {
    wire();
    modal.querySelector(".bmodal-close").addEventListener("click", closeModal);
    modal.querySelector(".bmodal-backdrop").addEventListener("click", closeModal);
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeModal();
    });
    // re-wire if menu tabs swap content in later
    document.addEventListener("click", function (e) {
      if (e.target.closest(".menu-tabs")) setTimeout(wire, 50);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
