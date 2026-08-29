/* =====================================================================
   DEVINETTE — script.js
   Question à choix multiples. Une mauvaise réponse est éliminée (pas
   fin de partie immédiate) mais réduit le score potentiel ; le temps
   qui s'écoule aussi. Bonne réponse = victoire, temps épuisé = défaite.
   ===================================================================== */

Auth.requireAuth();
const currentUser = Storage.getCurrentUser();
const GAME_ID = 'devinette';

/* ---- Banque de questions, taguée par palier de difficulté ---- */
const QUESTION_BANK = [
    // ---- Tena mora (1-50) ----
    { palier: 'tres_facile', q: "Inona no atao hoe sakafo fototra ao Madagasikara ?", choix: ["Vary", "Mofo", "Ronono", "Hena"], reponse: 0 },
    { palier: 'tres_facile', q: "Inona no anaran'ny renivohitr'i Madagasikara ?", choix: ["Toamasina", "Antananarivo", "Mahajanga", "Fianarantsoa"], reponse: 1 },
    { palier: 'tres_facile', q: "Inona no atao hoe toerana ianarana ?", choix: ["Trano fivarotana", "Sekoly", "Toby miaramila", "Hopitaly"], reponse: 1 },
    { palier: 'tres_facile', q: "Inona no mamiratra any an-danitra atoandro ?", choix: ["Volana", "Kintana", "Masoandro", "Rahona"], reponse: 2 },
    { palier: 'tres_facile', q: "Inona no ilaina hividianana zavatra ?", choix: ["Vato", "Vola", "Rivotra", "Afo"], reponse: 1 },
    { palier: 'tres_facile', q: "Inona no sotroina isan'andro mba tsy ho mangetaheta ?", choix: ["Rano", "Menaka", "Divay", "Lavenona"], reponse: 0 },
    { palier: 'tres_facile', q: "Inona no loko iray amin'ny sainam-pirenena malagasy ?", choix: ["Volomparasy", "Mena", "Volontany", "Manga"], reponse: 1 },
    { palier: 'tres_facile', q: "Inona no atao hoe ambony indrindra amin'ny vatan'olona ?", choix: ["Tongotra", "Tanana", "Loha", "Kibo"], reponse: 2 },
    { palier: 'tres_facile', q: "Inona no isa manaraka ny sivifolo sy sivy ?", choix: ["Zato", "Folo", "Valo", "Sivy"], reponse: 0 },
    { palier: 'tres_facile', q: "Inona no atao hoe fotoana maizina, mifanohitra amin'ny antoandro ?", choix: ["Maraina", "Alina", "Hariva", "Atoandro"], reponse: 1 },
    { palier: 'tres_facile', q: "Inona no ilaina hiveloman'ny olombelona rehetra ?", choix: ["Vola", "Aina", "Fanamby", "Voninahitra"], reponse: 1 },

    // ---- Mora (51-100) ----
    { palier: 'facile', q: "Inona no atao hoe biby fiompy lehibe malagasy, ilaina amin'ny asa tany ?", choix: ["Alika", "Omby", "Saka", "Vorona"], reponse: 1 },
    { palier: 'facile', q: "Iza no mampianatra ao am-pianarana ?", choix: ["Mpianatra", "Mpitantsoratra", "Mpampianatra", "Mpivarotra"], reponse: 2 },
    { palier: 'facile', q: "Inona no biby mpiambina trano fahiny hatramin'izao ?", choix: ["Saka", "Alika", "Omby", "Vorona"], reponse: 1 },
    { palier: 'facile', q: "Inona no mamiratra any an-danitra alina ?", choix: ["Masoandro", "Volana", "Rahona", "Tafio-drivotra"], reponse: 1 },
    { palier: 'facile', q: "Inona no maniry any anaty ala, misy sampany sy raviny ?", choix: ["Hazo", "Vato", "Rano", "Fasika"], reponse: 0 },
    { palier: 'facile', q: "Inona no vokatry ny hazo, matetika mamy ka azo hanina ?", choix: ["Voankazo", "Anana", "Vary", "Ovy"], reponse: 0 },
    { palier: 'facile', q: "Inona no atao hoe olona tia sy mifankatia aminao, tsy havana ?", choix: ["Vahiny", "Namana", "Fahavalo", "Mpianatra"], reponse: 1 },
    { palier: 'facile', q: "Inona no milatsaka avy any an-danitra rehefa mirotsaka ny rahona ?", choix: ["Orana", "Rivotra", "Kintana", "Vovoka"], reponse: 0 },
    { palier: 'facile', q: "Firy volana no ao anatin'ny taona iray ?", choix: ["Sivy", "Folo", "Iraika ambin'ny folo", "Roa ambin'ny folo"], reponse: 3 },
    { palier: 'facile', q: "Inona no toerana anaovana sakafo ao an-trano ?", choix: ["Efitrano", "Lakozia", "Rihana", "Tokotany"], reponse: 1 },
    { palier: 'facile', q: "Inona no atao hoe rano lehibe, tsy mikoriana ?", choix: ["Farihy", "Riaka", "Renirano", "Ranomasina"], reponse: 0 },

    // ---- Antonony (101-150) ----
    { palier: 'intermediaire', q: "Inona no atao hoe fahaizana misaina tsara sy mandinika alohan'ny hanapa-kevitra ?", choix: ["Fahasahiana", "Fahendrena", "Fahafahana", "Fahatezerana"], reponse: 1 },
    { palier: 'intermediaire', q: "Inona no atao hoe fisafidianana ny mpitondra amin'ny alalan'ny latsa-bato ?", choix: ["Fifidianana", "Fifaninanana", "Fanadinana", "Fankasitrahana"], reponse: 0 },
    { palier: 'intermediaire', q: "Inona no mifanohitra amin'ny 'haizina' ?", choix: ["Fahazavana", "Fahalemena", "Fahoriana", "Fahasahiana"], reponse: 0 },
    { palier: 'intermediaire', q: "Inona no atao hoe fitondran-tena mendrika amin'ny hafa ?", choix: ["Fanajana", "Fanadinoana", "Fandrahonana", "Fanadinana"], reponse: 0 },
    { palier: 'intermediaire', q: "Inona no atao hoe fahaiza-miandry am-pahatoniana, tsy maika ?", choix: ["Faharetana", "Fahavelomana", "Fahatezerana", "Fahasosorana"], reponse: 0 },
    { palier: 'intermediaire', q: "Inona no atao hoe fitondrana orinasa na fikambanana iray ?", choix: ["Fitantanana", "Fitaovana", "Fitaterana", "Fitiliana"], reponse: 0 },
    { palier: 'intermediaire', q: "Inona no atao hoe fanjakana atsahatry ny mpitondra iray ?", choix: ["Fanjakana", "Faritany", "Kaominina", "Distrika"], reponse: 0 },
    { palier: 'intermediaire', q: "Iza no antsoina hoe olona miaro ny firenena amin'ny ady ?", choix: ["Miaramila", "Mpivarotra", "Mpianatra", "Mpamboly"], reponse: 0 },
    { palier: 'intermediaire', q: "Inona no atao hoe toerana itsaboana marary ?", choix: ["Hopitaly", "Sekoly", "Fiangonana", "Fokontany"], reponse: 0 },
    { palier: 'intermediaire', q: "Iza no antsoina hoe olona mikarakara ny fambolena ?", choix: ["Tantsaha", "Mpitsabo", "Mpanoratra", "Mpampianatra"], reponse: 0 },
    { palier: 'intermediaire', q: "Inona no atao hoe fizarana ara-panjakana ambany indrindra ?", choix: ["Kaominina", "Faritany", "Governora", "Minisitra"], reponse: 0 },

    // ---- Antonony sarotra (151-200) ----
    { palier: 'pseudo_difficile', q: "Inona no atao hoe fitsapana ny fahalalan'ny mpianatra ?", choix: ["Fanadinana", "Fanabeazana", "Fankasitrahana", "Fahalalahana"], reponse: 0 },
    { palier: 'pseudo_difficile', q: "Inona no atao hoe tsy misy ady na korontana eo amin'ny firenena ?", choix: ["Fiadanana", "Fifaninanana", "Fahefana", "Fanabeazana"], reponse: 0 },
    { palier: 'pseudo_difficile', q: "Inona no atao hoe fihalehibiazana na fivoarana isan'ambaratonga ?", choix: ["Fitomboana", "Fahasimbana", "Fahoriana", "Fahakiviana"], reponse: 0 },
    { palier: 'pseudo_difficile', q: "Inona no atao hoe finoana fa marina sy mendrika ny olona iray ?", choix: ["Fahatokisana", "Fahatakarana", "Fahatongavana", "Fahatsapana"], reponse: 0 },
    { palier: 'pseudo_difficile', q: "Inona no atao hoe fanapariahana zavatra araka ny drafitra voafaritra mialoha ?", choix: ["Fandaharana", "Fandrosoana", "Fanovana", "Fanoherana"], reponse: 0 },
    { palier: 'pseudo_difficile', q: "Inona no atao hoe fitahiana omena maimaim-poana, tsy notadiavina ?", choix: ["Fahasoavana", "Fahasarotana", "Fahalemena", "Fahasosorana"], reponse: 0 },
    { palier: 'pseudo_difficile', q: "Iza no antsoina hoe lehiben'ny faritra iray ?", choix: ["Governora", "Senatera", "Depiote", "Minisitra"], reponse: 0 },
    { palier: 'pseudo_difficile', q: "Inona no atao hoe olona mitarika miaramila ?", choix: ["Kaomandy", "Tantsaha", "Mpivarotra", "Mpanoratra"], reponse: 0 },
    { palier: 'pseudo_difficile', q: "Inona no atao hoe fikarakarana biby fiompy ?", choix: ["Fiompiana", "Fambolena", "Fanafody", "Fitsaboana"], reponse: 0 },
    { palier: 'pseudo_difficile', q: "Iza no antsoina hoe olona mividy entana na serivisy amin'ny mpivarotra ?", choix: ["Mpanjifa", "Mpampiasa", "Mpianatra", "Vahiny"], reponse: 0 },
    { palier: 'pseudo_difficile', q: "Inona no atao hoe fikarakarana ny tany hamokarana voly ?", choix: ["Fambolena", "Fiompiana", "Fanadinana", "Fandaminana"], reponse: 0 },

    // ---- Sarotra (201-250) : vocabulaire ancien mais encore utilisé ----
    { palier: 'difficile', q: "Inona no atao hoe olona mahay fanaovam-body malagasy fahiny ?", choix: ["Ombiasa", "Mpampianatra", "Mpivarotra", "Tandapa"], reponse: 0 },
    { palier: 'difficile', q: "Inona no atao hoe hery tsy hita maso, natao manan-danja araka ny lovantsofina ?", choix: ["Hasina", "Fahasosorana", "Fahalemena", "Fahakiviana"], reponse: 0 },
    { palier: 'difficile', q: "Inona no atao hoe zavatra tsy azo atao araka ny lovantsofina malagasy ?", choix: ["Fady", "Fanamby", "Fitaovana", "Fandaharana"], reponse: 0 },
    { palier: 'difficile', q: "Inona no atao hoe fanovana ny lamban'ny fasan-drazana, fombafomba malagasy fahiny ?", choix: ["Famadihana", "Fanompoana", "Fanadinana", "Fanabeazana"], reponse: 0 },
    { palier: 'difficile', q: "Iza no antsoina hoe taranaky ny mpanjaka fahiny ?", choix: ["Andriana", "Tandapa", "Vazimba", "Hova"], reponse: 0 },
    { palier: 'difficile', q: "Inona no atao hoe anjara mombamomba ny fiainan'ny olona, araka ny finoana fahiny ?", choix: ["Vintana", "Fahefana", "Faharetana", "Fahaizana"], reponse: 0 },
    { palier: 'difficile', q: "Inona no atao hoe zavatra natao fiarovana araka ny finoana fahiny ?", choix: ["Ody", "Fitaovana", "Fanafody", "Sary"], reponse: 0 },
    { palier: 'difficile', q: "Inona no atao hoe fomba fanandroana amin'ny voanjo ?", choix: ["Sikidy", "Ohabolana", "Hainteny", "Kabary"], reponse: 0 },
    { palier: 'difficile', q: "Inona no atao hoe fitenenana fahendren-drazana, ohatra hoe 'aleo very tsikalakalam-bary toy izay very tsikalakalam-panahy' ?", choix: ["Ohabolana", "Sikidy", "Famadihana", "Vintana"], reponse: 0 },
    { palier: 'difficile', q: "Inona no atao hoe karazana tononkalo malagasy fahiny, amim-panoharana ?", choix: ["Hainteny", "Kabary", "Angano", "Valiha"], reponse: 0 },
    { palier: 'difficile', q: "Inona no atao hoe zava-maneno nentim-paharazana malagasy, misy tady maro ?", choix: ["Valiha", "Kabary", "Sikidy", "Fady"], reponse: 0 },

    // ---- Tena sarotra (251-300) : vocabulaire archaïque, presque oublié ----
    { palier: 'infernal', q: "Inona no atao hoe olona tsy afaka, saranga fahiny teo amin'ny fiaraha-monina malagasy ?", choix: ["Andevo", "Hova", "Vazimba", "Tandapa"], reponse: 0 },
    { palier: 'infernal', q: "Iza no antsoina hoe iraky ny mpanjaka fahiny ?", choix: ["Tsimandoa", "Ombiasa", "Vadin-tany", "Tangalamena"], reponse: 0 },
    { palier: 'infernal', q: "Inona no atao hoe asa an-tery nampanaovin'ny fanjakana ny vahoaka fahiny ?", choix: ["Fanompoana", "Fanadinana", "Fanabeazana", "Fitantanana"], reponse: 0 },
    { palier: 'infernal', q: "Iza no antsoina hoe governora fahiny amin'ny faritra iray ?", choix: ["Vadin-tany", "Tsimandoa", "Ombiasa", "Solombavan-tany"], reponse: 0 },
    { palier: 'infernal', q: "Inona no atao hoe faritany kely notarihin'ny andriana fahiny ?", choix: ["Menakely", "Tandapa", "Hazomanga", "Trimobe"], reponse: 0 },
    { palier: 'infernal', q: "Inona no atao hoe vorona nampiasaina ho ivon'ny fanjakana fahiny ?", choix: ["Voromahery", "Vorondolo", "Fody", "Tsikirity"], reponse: 0 },
    { palier: 'infernal', q: "Iza no antsoina hoe mpanjaka lehibe indrindra fahiny ?", choix: ["Mpanjakabe", "Tandapa", "Ombiasa", "Vadin-tany"], reponse: 0 },
    { palier: 'infernal', q: "Inona no atao hoe haja avo natolotry ny fanjakana ho an'olona iray fahiny ?", choix: ["Voninahitra", "Fanompoana", "Fady", "Vintana"], reponse: 0 },
    { palier: 'infernal', q: "Inona no atao hoe lamba manokana ho an'ny andriana fahiny ?", choix: ["Lamban'andriana", "Menakely", "Trimobe", "Tandapa"], reponse: 0 },
    { palier: 'infernal', q: "Inona no atao hoe fikambanan'ny loholona fahiny hanapahan-kevitra ?", choix: ["Trimobe", "Fanompoana", "Menakely", "Hazomanga"], reponse: 0 },
    { palier: 'infernal', q: "Iza no antsoina hoe solontenan'ny vahoaka fahiny ?", choix: ["Solombavan-tany", "Tsimandoa", "Vadin-tany", "Ombiasa"], reponse: 0 },

    // ---- Deuxième vague (renfort de chaque palier) ----
    { palier: 'tres_facile', q: "Inona no mifanohitra amin'ny lava ?", choix: ["Fohy", "Mafy", "Mena", "Mavo"], reponse: 0 },
    { palier: 'tres_facile', q: "Inona no atao hoe atao mba hahazoana karama ?", choix: ["Lalao", "Asa", "Fialam-boly", "Fitsangatsanganana"], reponse: 1 },
    { palier: 'tres_facile', q: "Inona no biby manidina, manana elatra ?", choix: ["Vorona", "Omby", "Saka", "Alika"], reponse: 0 },
    { palier: 'tres_facile', q: "Inona no atao hoe teny fampiasa handrarana zavatra ?", choix: ["Eny", "Aza", "Ary", "Tsy"], reponse: 1 },
    { palier: 'tres_facile', q: "Inona no atao hoe mifanohitra amin'ny mafy ?", choix: ["Malemy", "Mavesatra", "Maivana", "Marina"], reponse: 0 },

    { palier: 'facile', q: "Inona no atao hoe toerana anaovana sakafo ?", choix: ["Lakozia", "Efitrano", "Rihana", "Tokotany"], reponse: 0 },
    { palier: 'facile', q: "Inona no atao hoe olona avy any ivelan'ny firenena ?", choix: ["Vahiny", "Havana", "Namana", "Zandry"], reponse: 0 },
    { palier: 'facile', q: "Inona no atao hoe fikorianan'ny rano be dia be, mahery vaika ?", choix: ["Riaka", "Farihy", "Ranomasina", "Ony"], reponse: 0 },
    { palier: 'facile', q: "Inona no fitaovana ampiasaina hanapahana zavatra ?", choix: ["Antsy", "Kofehy", "Penina", "Baolina"], reponse: 0 },
    { palier: 'facile', q: "Inona no fizarana ara-jeografika iray ?", choix: ["Faritra", "Fanjakana", "Fikambanana", "Orinasa"], reponse: 0 },

    { palier: 'intermediaire', q: "Inona no antsoina hoe olona vao mianatra ao am-pianarana ?", choix: ["Mpianatra", "Mpampianatra", "Mpitsabo", "Mpamboly"], reponse: 0 },
    { palier: 'intermediaire', q: "Inona no atao hoe fitaovana elektrônika ampiasaina fikarohana ?", choix: ["Solosaina", "Fitaratra", "Fandriana", "Tetezana"], reponse: 0 },
    { palier: 'intermediaire', q: "Inona no atao hoe olona mikarakara ny fambolena ?", choix: ["Tantsaha", "Governora", "Minisitra", "Jeneraly"], reponse: 0 },
    { palier: 'intermediaire', q: "Inona no fanaovana soratra amin'ny taratasy ?", choix: ["Fanoratana", "Famakiana", "Fitenenana", "Fandaminana"], reponse: 0 },
    { palier: 'intermediaire', q: "Iza no antsoina hoe olona mitsabo ny marary ?", choix: ["Mpitsabo", "Mpanjifa", "Mpivarotra", "Tantsaha"], reponse: 0 },

    { palier: 'pseudo_difficile', q: "Inona no atao hoe mpikambana ao amin'ny antenimieran-doholona ?", choix: ["Senatera", "Depiote", "Governora", "Kaomandy"], reponse: 0 },
    { palier: 'pseudo_difficile', q: "Inona no atao hoe fizarana ara-panjakana eo anelanelan'ny faritra sy kaominina ?", choix: ["Distrika", "Fokontany", "Renivohitra", "Tanàna"], reponse: 0 },
    { palier: 'pseudo_difficile', q: "Inona no atao hoe mpitarika ambony indrindra ao amin'ny tafika ?", choix: ["Jeneraly", "Minisitra", "Depiote", "Governora"], reponse: 0 },
    { palier: 'pseudo_difficile', q: "Inona no atao hoe zon'ny mpitondra hanapa-kevitra sy hitondra ny fanjakana ?", choix: ["Fahefana", "Faharetana", "Fahaizana", "Fahatokisana"], reponse: 0 },
    { palier: 'pseudo_difficile', q: "Inona no atao hoe fahatokiana amin'ny ho avy tsara, na dia sarotra aza ny toe-javatra ankehitriny ?", choix: ["Fanantenana", "Fahasosorana", "Fahalemena", "Fahasarotana"], reponse: 0 },

    { palier: 'difficile', q: "Iza no antsoina hoe olona mahay mamantatra ny andro tsara, araka ny finoana fahiny ?", choix: ["Mpanandro", "Mpitaiza", "Mpivarotra", "Mpanjifa"], reponse: 0 },
    { palier: 'difficile', q: "Inona no atao hoe vahoaka voalohany nipetraka teto Madagasikara, araka ny angano ?", choix: ["Vazimba", "Hova", "Andriana", "Andevo"], reponse: 0 },
    { palier: 'difficile', q: "Inona no atao hoe fanovana ny lamban'ny fasan-drazana, fombafomba fahiny ?", choix: ["Famadihana", "Fanompoana", "Fanadinana", "Fanabeazana"], reponse: 0 },
    { palier: 'difficile', q: "Inona no atao hoe tantara nomen-drazana am-bava, mifototra amin'ny finoana ?", choix: ["Angano", "Kabary", "Sikidy", "Valiha"], reponse: 0 },
    { palier: 'difficile', q: "Inona no atao hoe olona mikarakara ny zaza araka ny fomba fahiny ?", choix: ["Mpitaiza", "Mpampianatra", "Mpitsabo", "Mpivarotra"], reponse: 0 },

    { palier: 'infernal', q: "Inona no atao hoe fiantsoana ny mpanjaka lehibe indrindra fahiny ?", choix: ["Mpanjakabe", "Tandapa", "Ombiasa", "Vadin-tany"], reponse: 0 },
    { palier: 'infernal', q: "Inona no atao hoe haja avo natolotry ny fanjakana ho an'olona iray, araka ny fomba fahiny ?", choix: ["Voninahitra", "Fanompoana", "Fady", "Vintana"], reponse: 0 },
    { palier: 'infernal', q: "Inona no atao hoe fikambanan'ny loholona fahiny hanapahan-kevitra lehibe ?", choix: ["Trimobe", "Fanompoana", "Menakely", "Hazomanga"], reponse: 0 },
    { palier: 'infernal', q: "Inona no atao hoe lamba manokana natokana ho an'ny andriana fahiny ?", choix: ["Lamban'andriana", "Menakely", "Trimobe", "Tandapa"], reponse: 0 },
    { palier: 'infernal', q: "Inona no atao hoe andry hazo fanaovana sorona any atsimo ?", choix: ["Hazomanga", "Tandapa", "Ombiasa", "Fanjakan-tany"], reponse: 0 },
];

/* =====================================================================
   BANQUE DÉDIÉE AU DÉFI QUOTIDIEN — volontairement séparée de
   QUESTION_BANK, pour ne jamais interférer avec la progression normale.
   ===================================================================== */
const DEFI_QUESTION_BANK = [
    { palier: 'tres_facile', q: "Inona no atao hoe toerana ianarana ?", choix: ["Trano fivarotana", "Sekoly", "Toby miaramila", "Hopitaly"], reponse: 1 },
    { palier: 'tres_facile', q: "Inona no ilaina hividianana zavatra ?", choix: ["Vato", "Vola", "Rivotra", "Afo"], reponse: 1 },
    { palier: 'facile', q: "Inona no atao hoe olona tia sy mifankatia aminao ?", choix: ["Vahiny", "Namana", "Fahavalo", "Mpianatra"], reponse: 1 },
    { palier: 'facile', q: "Inona no toerana anaovana sakafo ao an-trano ?", choix: ["Efitrano", "Lakozia", "Rihana", "Tokotany"], reponse: 1 },
    { palier: 'intermediaire', q: "Inona no atao hoe fanjakana atsahatry ny mpitondra iray ?", choix: ["Fanjakana", "Faritany", "Kaominina", "Distrika"], reponse: 0 },
    { palier: 'intermediaire', q: "Iza no antsoina hoe olona miaro ny firenena amin'ny ady ?", choix: ["Miaramila", "Mpivarotra", "Mpianatra", "Mpamboly"], reponse: 0 },
    { palier: 'pseudo_difficile', q: "Iza no antsoina hoe lehiben'ny faritra iray ?", choix: ["Governora", "Senatera", "Depiote", "Minisitra"], reponse: 0 },
    { palier: 'pseudo_difficile', q: "Inona no atao hoe fikarakarana ny tany hamokarana voly ?", choix: ["Fambolena", "Fiompiana", "Fanadinana", "Fandaminana"], reponse: 0 },
    { palier: 'difficile', q: "Inona no atao hoe anjara mombamomba ny fiainan'ny olona, araka ny finoana fahiny ?", choix: ["Vintana", "Fahefana", "Faharetana", "Fahaizana"], reponse: 0 },
    { palier: 'difficile', q: "Iza no antsoina hoe olona mahay fanaovam-body malagasy fahiny ?", choix: ["Ombiasa", "Mpampianatra", "Mpivarotra", "Tandapa"], reponse: 0 },
    { palier: 'infernal', q: "Iza no antsoina hoe mpanjaka lehibe indrindra fahiny ?", choix: ["Mpanjakabe", "Tandapa", "Ombiasa", "Vadin-tany"], reponse: 0 },
    { palier: 'infernal', q: "Inona no atao hoe asa an-tery nampanaovin'ny fanjakana ny vahoaka fahiny ?", choix: ["Fanompoana", "Fanadinana", "Fanabeazana", "Fitantanana"], reponse: 0 }
];

/* ---- Son (propre à ce jeu) ---- */
const SOUND_KEY = `tm_son_${GAME_ID}`;
const Sound = {
    ctx: null,
    isOn() { return localStorage.getItem(SOUND_KEY) !== 'off'; },
    toggle() { localStorage.setItem(SOUND_KEY, this.isOn() ? 'off' : 'on'); updateSoundIcon(); },
    beep(freq, duration = 0.12, type = 'sine') {
        if (!this.isOn()) return;
        if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type; osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
        osc.connect(gain).connect(this.ctx.destination);
        osc.start(); osc.stop(this.ctx.currentTime + duration);
    },
    correct() { this.beep(880, 0.15, 'triangle'); setTimeout(() => this.beep(1175, 0.2, 'triangle'), 120); },
    wrong() { this.beep(180, 0.2, 'sawtooth'); },
    tick() { this.beep(440, 0.05, 'square'); },
    hint() { this.beep(660, 0.1, 'sine'); }
};
function updateSoundIcon() {
    document.getElementById('btn-sound').innerHTML = Utils.icon(Sound.isOn() ? 'volume-on' : 'volume-off');
}

/* ---- Progression ---- */
const PROGRESS_KEY = `tm_progress_${GAME_ID}_${currentUser.id}`;
function getSavedLevel() { return parseInt(localStorage.getItem(PROGRESS_KEY) || '1', 10); }
function saveLevel(n) { localStorage.setItem(PROGRESS_KEY, String(n)); }

const urlParams = new URLSearchParams(window.location.search);
let niveauActuel = Math.min(Math.max(parseInt(urlParams.get('niveau') || getSavedLevel(), 10), 1), Utils.MAX_NIVEAU);
const estDefi = urlParams.get('defi') === '1';

let levelConfig, questionCourante, indicesUtilises, tentativesRatees, tempsRestant, timerInterval, partieTerminee;

async function demarrerNiveau(n) {
    niveauActuel = n;
    levelConfig = Utils.getLevelConfig(n);

    questionCourante = estDefi
        ? Utils.pickQuestionForChallenge(n, DEFI_QUESTION_BANK)
        : await Utils.pickNoRepeat(GAME_ID, currentUser.id, n, (() => {
            const pool = QUESTION_BANK.filter(q => q.palier === levelConfig.palier);
            return pool.length ? pool : QUESTION_BANK;
        })(), q => q.q, null);

    indicesUtilises = 0;
    tentativesRatees = 0;
    tempsRestant = levelConfig.tempsSecondes;
    partieTerminee = false;

    document.getElementById('niveau-label').textContent = `Haavo ${n} / ${Utils.MAX_NIVEAU}`;
    const badge = document.getElementById('badge-palier');
    badge.textContent = Utils.palierLabel(levelConfig.palier);
    badge.className = `badge-diff ${Utils.palierColorClass(levelConfig.palier)}`;

    document.getElementById('question-text').textContent = questionCourante.q;
    document.getElementById('points-value').textContent = '0';
    document.getElementById('hint-count').textContent = Math.max(0, levelConfig.indicesAutorises - indicesUtilises);
    document.getElementById('timer-icon').innerHTML = Utils.icon('clock');
    document.getElementById('points-icon').innerHTML = Utils.icon('star');
    updateSoundIcon();

    renderChoices();
    updateTimerDisplay();

    clearInterval(timerInterval);
    timerInterval = setInterval(tickTimer, 1000);
}

function renderChoices() {
    const grid = document.getElementById('choices-grid');
    grid.innerHTML = questionCourante.choix.map((c, i) =>
        `<button class="choice-btn" data-index="${i}">${c}</button>`
    ).join('');
    grid.querySelectorAll('.choice-btn').forEach(btn => btn.addEventListener('click', onChoiceClick));
}

function onChoiceClick(e) {
    if (partieTerminee) return;
    const btn = e.currentTarget;
    const i = parseInt(btn.dataset.index, 10);

    if (i === questionCourante.reponse) {
        clearInterval(timerInterval);
        btn.classList.add('correct');
        terminerPartie(true);
    } else {
        btn.classList.add('wrong');
        btn.disabled = true;
        tentativesRatees++;
        Sound.wrong();
        Utils.toast('Tsia, tsy izay. Andramo indray !', 'error');
    }
}

function tickTimer() {
    if (partieTerminee) return;
    tempsRestant--;
    updateTimerDisplay();
    if (tempsRestant <= 5 && tempsRestant > 0) Sound.tick();
    if (tempsRestant <= 0) { clearInterval(timerInterval); terminerPartie(false); }
}

function updateTimerDisplay() {
    document.getElementById('timer-value').textContent = Utils.formatTime(tempsRestant);
    const pct = Math.max(0, (tempsRestant / levelConfig.tempsSecondes) * 100);
    const fill = document.getElementById('timer-fill');
    fill.style.width = pct + '%';
    const isWarning = tempsRestant <= levelConfig.tempsSecondes * 0.25;
    fill.classList.toggle('warning', isWarning);
    document.getElementById('game-timer').classList.toggle('timer-warning', isWarning);
}

/* ---- Indice = élimine une mauvaise réponse restante (50/50) ---- */
document.getElementById('btn-hint').addEventListener('click', () => {
    if (partieTerminee) return;
    const restants = levelConfig.indicesAutorises - indicesUtilises;
    if (restants <= 0) { Utils.toast('Tsy manana fanampiana intsony ianao.', 'error'); return; }
    const boutons = [...document.querySelectorAll('.choice-btn')].filter(b =>
        !b.disabled && parseInt(b.dataset.index, 10) !== questionCourante.reponse
    );
    if (!boutons.length) return;
    const cible = boutons[Math.floor(Math.random() * boutons.length)];
    cible.classList.add('eliminated');
    cible.disabled = true;
    indicesUtilises++;
    Sound.hint();
    document.getElementById('hint-count').textContent = Math.max(0, levelConfig.indicesAutorises - indicesUtilises);
});

function terminerPartie(gagne) {
    partieTerminee = true;
    document.querySelectorAll('.choice-btn').forEach(b => b.disabled = true);
    if (!gagne) {
        const correctBtn = document.querySelector(`.choice-btn[data-index="${questionCourante.reponse}"]`);
        if (correctBtn) correctBtn.classList.add('correct');
    }

    let points = 0, etoiles = 0, xp = 0;
    if (gagne) {
        Sound.correct();
        const bonusTemps = tempsRestant / levelConfig.tempsSecondes;
        const penalite = Math.max(0.3, 1 - (indicesUtilises * 0.2) - (tentativesRatees * 0.15));
        points = Math.round(100 * levelConfig.multiplicateurPoints * (0.5 + bonusTemps * 0.5) * penalite);
        xp = Math.round(levelConfig.xpBase * (tentativesRatees === 0 && indicesUtilises === 0 ? 1 : 0.7));
        // Étoiles = 3 moins le nombre total de "défauts" (indices + erreurs),
        // plafonné à 0 : une réponse parfaite (sans indice ni erreur) donne
        // toujours 3 étoiles, quel que soit le temps mis à répondre.
        etoiles = Math.max(1, 3 - Math.min(2, indicesUtilises + tentativesRatees));

        if (estDefi) {
            // Défi quotidien : TOTALEMENT séparé de la progression générale.
            const today = new Date().toISOString().slice(0, 10);
            const result = Storage.setChallengeProgress(currentUser.id, today, GAME_ID, { statut: 'vita', score: points });
            if (window.Api) Api.updateChallengeProgress({ date: today, jeu: GAME_ID, statut: 'vita', score: points }).catch(() => {});
            if (result.bonusAttribue) {
                setTimeout(() => Utils.toast("Valisoa fanampiny voaray ! Vita avokoa ny 3 lalao.", 'success'), 600);
            }
        } else {
            // Partie normale : alimente le profil général et le classement.
            Storage.addScore({ userId: currentUser.id, jeu: GAME_ID, niveau: niveauActuel, points, etoiles });
            if (window.Api) Api.addScore({ jeu: GAME_ID, niveau: niveauActuel, points, etoiles }).catch(() => {});
            const profile = Storage.getProfile(currentUser.id);
            Storage.updateProfile(currentUser.id, {
                xp: profile.xp + xp,
                pointsTotal: profile.pointsTotal + points,
                niveauGlobal: Math.max(profile.niveauGlobal, 1 + Math.floor((profile.xp + xp) / 100)),
                dernierJeu: GAME_ID
            });
            if (niveauActuel >= getSavedLevel()) saveLevel(Math.min(Utils.MAX_NIVEAU, niveauActuel + 1));
        }
    } else {
        Sound.wrong();
    }

    document.getElementById('points-value').textContent = points;
    afficherResultat(gagne, points, xp, etoiles);
}

function afficherResultat(gagne, points, xp, etoiles) {
    const modal = document.getElementById('result-modal');
    const icon = document.getElementById('result-icon');
    icon.className = `result-modal__icon ${gagne ? 'win' : 'lose'}`;
    icon.innerHTML = Utils.icon(gagne ? 'check' : 'x');
    document.getElementById('result-title').textContent = gagne ? 'Mahafinaritra !' : 'Lany fotoana !';
    document.getElementById('result-subtitle').textContent = gagne
        ? 'Nahavaly marina ianao.'
        : 'Tsy nahavaly tamin\'ny fotoana ianao.';
    document.getElementById('result-stars').innerHTML = gagne ? Utils.starsHTML(etoiles, 3) : '';
    document.getElementById('result-points').textContent = points;
    document.getElementById('result-xp').textContent = xp;
    document.getElementById('result-answer').textContent = `Valiny marina: ${questionCourante.choix[questionCourante.reponse]}`;

    const btnNext = document.getElementById('btn-next');
    if (estDefi) {
        btnNext.textContent = "Hiverina any amin'ny fitambarana";
    } else {
        btnNext.textContent = 'Manaraka';
    }

    modal.classList.add('open');
}

document.getElementById('btn-retry').addEventListener('click', () => {
    document.getElementById('result-modal').classList.remove('open');
    demarrerNiveau(niveauActuel);
});
document.getElementById('btn-next').addEventListener('click', () => {
    document.getElementById('result-modal').classList.remove('open');
    if (estDefi) {
        window.location.href = '../../dashboard/index.html';
    } else {
        demarrerNiveau(Math.min(Utils.MAX_NIVEAU, niveauActuel + 1));
    }
});

/* ---- Règles ---- */
const rulesModal = document.getElementById('rules-modal');
document.getElementById('btn-rules').addEventListener('click', () => rulesModal.classList.add('open'));
document.getElementById('rules-close').addEventListener('click', () => rulesModal.classList.remove('open'));
document.getElementById('rules-ok').addEventListener('click', () => rulesModal.classList.remove('open'));
rulesModal.addEventListener('click', (e) => { if (e.target === rulesModal) rulesModal.classList.remove('open'); });

document.getElementById('btn-sound').addEventListener('click', Sound.toggle);
Utils.initBackToTop();

demarrerNiveau(niveauActuel);
