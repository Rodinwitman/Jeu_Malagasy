/* =====================================================================
   MOT NAFENINA — script.js
   Jeu "mot caché" fonctionnel : indice -> lettres partiellement
   révélées -> le joueur tape la réponse avant la fin du temps.
   ===================================================================== */

Auth.requireAuth();
const currentUser = Storage.getCurrentUser();
const GAME_ID = 'mot_cache';

/* ---- Banque de mots (autonome : pas de fetch, fonctionne en file://) ---- */
const WORD_BANK = [
    // ---- Tena mora (1-50) : 3-4 lettres ----
    { mot: "aza", indice: "Teny fampiasa handrarana", categorie: "moderne" },
    { mot: "eny", indice: "Valiny milaza fanekena", categorie: "moderne" },
    { mot: "tsy", indice: "Teny fampiasa handavana", categorie: "moderne" },
    { mot: "ary", indice: "Teny mampitohy fehezanteny roa", categorie: "moderne" },
    { mot: "vola", indice: "Ilaina hividianana zavatra", categorie: "moderne" },
    { mot: "rano", indice: "Sotroina isan'andro", categorie: "moderne" },
    { mot: "vary", indice: "Sakafo fototra malagasy", categorie: "moderne" },
    { mot: "hazo", indice: "Maniry any anaty ala", categorie: "moderne" },
    { mot: "omby", indice: "Biby fiompy lehibe malagasy", categorie: "moderne" },
    { mot: "saka", indice: "Biby fiompy mpisambotra totozy", categorie: "moderne" },
    { mot: "tany", indice: "Ipetrahantsika, ambanin'ny lanitra", categorie: "moderne" },
    { mot: "lay", indice: "Trano lamba fandehanana", categorie: "moderne" },
    { mot: "afo", indice: "Mahamay, ilaina handrahoana", categorie: "moderne" },
    { mot: "ora", indice: "Fandrefesana ny fotoana", categorie: "moderne" },
    { mot: "mena", indice: "Loko iray amin'ny sainam-pirenena", categorie: "moderne" },
    { mot: "mavo", indice: "Loko toy ny an'ny masoandro", categorie: "moderne" },
    { mot: "lava", indice: "Mifanohitra amin'ny fohy", categorie: "moderne" },
    { mot: "fohy", indice: "Mifanohitra amin'ny lava", categorie: "moderne" },
    { mot: "mafy", indice: "Mifanohitra amin'ny malemy", categorie: "moderne" },
    { mot: "loha", indice: "Ambony indrindra amin'ny vatana", categorie: "moderne" },
    { mot: "tena", indice: "Vatan'olona, na teny fanamafisana", categorie: "moderne" },
    { mot: "mora", indice: "Tsy sarotra, na tsy lafo", categorie: "moderne" },
    { mot: "zato", indice: "Isa manaraka ny sivifolo sy sivy", categorie: "moderne" },
    { mot: "aina", indice: "Ilaina hiveloman'ny olombelona", categorie: "moderne" },
    { mot: "hita", indice: "Efa jerena, tsy miafina", categorie: "moderne" },
    { mot: "asa", indice: "Atao hahazoana karama", categorie: "moderne" },

    // ---- Mora (51-100) : 5-7 lettres ----
    { mot: "alika", indice: "Biby fiompy mpiambina trano", categorie: "moderne" },
    { mot: "vorona", indice: "Biby manana elatra sady manidina", categorie: "moderne" },
    { mot: "lanitra", indice: "Ambonin'ny tany, misy rahona", categorie: "moderne" },
    { mot: "tanana", indice: "Ampiasaina hiasana sy hisavana", categorie: "moderne" },
    { mot: "volana", indice: "Mamiratra any an-danitra alina", categorie: "moderne" },
    { mot: "kintana", indice: "Mamirapiratra any an-danitra alina", categorie: "moderne" },
    { mot: "sekoly", indice: "Toerana ianarana", categorie: "moderne" },
    { mot: "harena", indice: "Zavatra sarobidy", categorie: "moderne" },
    { mot: "tantara", indice: "Zava-nitranga fahiny", categorie: "moderne" },
    { mot: "kalesy", indice: "Fitaterana entin'omby fahiny", categorie: "moderne" },
    { mot: "voankazo", indice: "Vokatry ny hazo, mamy matetika", categorie: "moderne" },
    { mot: "tsara", indice: "Mifanohitra amin'ny ratsy", categorie: "moderne" },
    { mot: "ratsy", indice: "Mifanohitra amin'ny tsara", categorie: "moderne" },
    { mot: "marina", indice: "Tsy lainga, ara-bakiteny", categorie: "moderne" },
    { mot: "malemy", indice: "Mifanohitra amin'ny mafy", categorie: "moderne" },
    { mot: "mainty", indice: "Loko toy ny alina", categorie: "moderne" },
    { mot: "fotsy", indice: "Loko toy ny rahona", categorie: "moderne" },
    { mot: "maitso", indice: "Loko toy ny ahitra", categorie: "moderne" },
    { mot: "trano", indice: "Toerana ipetrahana", categorie: "moderne" },
    { mot: "ankizy", indice: "Zaza mbola tanora", categorie: "moderne" },
    { mot: "zandry", indice: "Havana kely noho ianao", categorie: "moderne" },
    { mot: "havana", indice: "Olona mifandray tapaka", categorie: "moderne" },
    { mot: "namana", indice: "Olona tia sy mifankatia", categorie: "moderne" },
    { mot: "sakaiza", indice: "Namana akaiky", categorie: "moderne" },
    { mot: "penina", indice: "Ampiasaina hanoratana", categorie: "moderne" },
    { mot: "kilalao", indice: "Zavatra ampiasain'ny zaza milalao", categorie: "moderne" },
    { mot: "baolina", indice: "Boribory, atsipika na hazakazahina", categorie: "moderne" },
    { mot: "lalao", indice: "Fialam-boly mahafinaritra", categorie: "moderne" },
    { mot: "rihana", indice: "Rihana ambonin'ny trano", categorie: "moderne" },
    { mot: "efitra", indice: "Faritra iray ao anaty trano", categorie: "moderne" },
    { mot: "lakozia", indice: "Toerana anaovana sakafo", categorie: "moderne" },
    { mot: "farihy", indice: "Rano lehibe, tsy mikoriana", categorie: "moderne" },
    { mot: "orana", indice: "Milatsaka avy any an-danitra", categorie: "moderne" },
    { mot: "rahona", indice: "Miloko fotsy any an-danitra", categorie: "moderne" },
    { mot: "taona", indice: "12 volana", categorie: "moderne" },
    { mot: "andro", indice: "24 ora", categorie: "moderne" },
    { mot: "alina", indice: "Fotoana maizina", categorie: "moderne" },
    { mot: "maraina", indice: "Fiandohan'ny andro", categorie: "moderne" },
    { mot: "hariva", indice: "Fiafaran'ny andro", categorie: "moderne" },
    { mot: "talata", indice: "Andro manaraka ny alatsinainy", categorie: "moderne" },
    { mot: "toerana", indice: "Faritra manokana iray", categorie: "moderne" },
    { mot: "zavatra", indice: "Teny ankapobeny ilazana na inona na inona", categorie: "moderne" },
    { mot: "sitrapo", indice: "Faniriana ao am-po", categorie: "moderne" },
    { mot: "tolotra", indice: "Zavatra atolotra na fanofanana", categorie: "moderne" },
    { mot: "orinasa", indice: "Fikambanana ara-barotra", categorie: "moderne" },
    { mot: "faritra", indice: "Fizarana ara-jeografika", categorie: "moderne" },
    { mot: "vahiny", indice: "Olona avy any ivelany", categorie: "moderne" },
    { mot: "riaka", indice: "Fikorianan'ny rano be dia be", categorie: "moderne" },
    { mot: "angady", indice: "Fitaovana fihadiana tany", categorie: "moderne" },
    { mot: "antsy", indice: "Fitaovana fanapahana", categorie: "moderne" },
    { mot: "kofehy", indice: "Kofehy manify fanjairana", categorie: "moderne" },
    { mot: "tanety", indice: "Tany avo, tsy misy hazo be", categorie: "moderne" },
    { mot: "havoana", indice: "Tendrombohitra kely", categorie: "moderne" },

    // ---- Antonony (101-150) : 8-9 lettres ----
    { mot: "mpianatra", indice: "Ilay mianatra ao am-pianarana", categorie: "moderne" },
    { mot: "fitiavana", indice: "Fihetseham-po lalina", categorie: "moderne" },
    { mot: "fahefana", indice: "Zon'ny mpitondra hanapa-kevitra", categorie: "moderne" },
    { mot: "fanajana", indice: "Fihetsika mendrika amin'ny hafa", categorie: "moderne" },
    { mot: "fiadanana", indice: "Tsy misy ady na korontana", categorie: "moderne" },
    { mot: "fitsipika", indice: "Lalàna arahina", categorie: "moderne" },
    { mot: "fahazavana", indice: "Mifanohitra amin'ny haizina", categorie: "moderne" },
    { mot: "fahasahiana", indice: "Tsy matahotra", categorie: "moderne" },
    { mot: "fanantenana", indice: "Fahatokiana amin'ny ho avy tsara", categorie: "moderne" },
    { mot: "fanoratana", indice: "Fanaovana soratra amin'ny taratasy", categorie: "moderne" },
    { mot: "fahaizana", indice: "Traikefa na fahalalana amin'ny zavatra iray", categorie: "moderne" },

    // ---- Antonony sarotra (151-200) : 8-9 lettres, plus rares ----
    { mot: "mpampianatra", indice: "Mampianatra ao am-pianarana", categorie: "moderne" },
    { mot: "fahasalamana", indice: "Toe-batana tsara", categorie: "moderne" },
    { mot: "fahalalahana", indice: "Tsy fanandevozana", categorie: "moderne" },
    { mot: "fifidianana", indice: "Fisafidianana mpitondra", categorie: "moderne" },
    { mot: "fahamarinana", indice: "Tsy lainga", categorie: "moderne" },
    { mot: "fanabeazana", indice: "Fampianarana zaza", categorie: "moderne" },
    { mot: "fahendrena", indice: "Fahaizana misaina tsara", categorie: "moderne" },
    { mot: "fahatsiarovana", indice: "Tsy fanadinoana ny lasa", categorie: "moderne" },
    { mot: "fifampifehezana", indice: "Fitondran-tena tsara amin'ny hafa", categorie: "moderne" },
    { mot: "fifandraisana", indice: "Fifampitondran'ny olona roa", categorie: "moderne" },
    { mot: "fankasitrahana", indice: "Fisaorana amin'ny zavatra natao", categorie: "moderne" },
    { mot: "faharetana", indice: "Fahaiza-miandry am-pahatoniana", categorie: "moderne" },
    { mot: "fitantanana", indice: "Fitondrana orinasa na fikambanana", categorie: "moderne" },
    { mot: "renivohitra", indice: "Tanàna lehibe indrindra amin'ny firenena", categorie: "moderne" },
    { mot: "fiaramanidina", indice: "Fitaterana manidina any an-danitra", categorie: "moderne" },
    { mot: "fanadinana", indice: "Fitsapana ny fahalalana", categorie: "moderne" },
    { mot: "fifaninanana", indice: "Fifampiraisan-tsaina hiady hery", categorie: "moderne" },
    { mot: "fahombiazana", indice: "Vokatra tsara azo tamin'ny ezaka", categorie: "moderne" },
    { mot: "fahamendrehana", indice: "Toetra tsara sy manaja tena", categorie: "moderne" },
    { mot: "fahatokisana", indice: "Finoana fa marina ny olona iray", categorie: "moderne" },

    // ---- Renfort de la tranche 8-9 lettres (intermédiaire + pseudo-difficile, 101-200) ----
    { mot: "fanjakana", indice: "Fitondrana ny firenena", categorie: "moderne" },
    { mot: "miaramila", indice: "Olona miaro ny firenena amin'ny ady", categorie: "moderne" },
    { mot: "mpitondra", indice: "Olona mitantana ny fanjakana", categorie: "moderne" },
    { mot: "indrindra", indice: "Teny fanamafisana, midika hoe tena", categorie: "moderne" },
    { mot: "fahazoana", indice: "Fahafahana mahazo zavatra", categorie: "moderne" },
    { mot: "minisitra", indice: "Mpitantana sampan-draharaham-panjakana", categorie: "moderne" },
    { mot: "kaominina", indice: "Fizarana ara-panjakana ambany indrindra", categorie: "moderne" },
    { mot: "distrika", indice: "Fizarana ara-panjakana eo anelanelan'ny faritra sy kaominina", categorie: "moderne" },
    { mot: "faritany", indice: "Fizarana ara-panjakana lehibe", categorie: "moderne" },
    { mot: "fambolena", indice: "Asa fikarakarana ny tany hamokarana", categorie: "moderne" },
    { mot: "fiompiana", indice: "Asa fikarakarana biby fiompy", categorie: "moderne" },
    { mot: "mpanjifa", indice: "Olona mividy entana na serivisy", categorie: "moderne" },
    { mot: "mpampiasa", indice: "Olona mampiasa mpiasa", categorie: "moderne" },
    { mot: "governora", indice: "Lehiben'ny faritra", categorie: "moderne" },
    { mot: "senatera", indice: "Mpikambana ao amin'ny antenimieran-doholona", categorie: "moderne" },
    { mot: "jeneraly", indice: "Mpitarika ambony indrindra ao amin'ny tafika", categorie: "moderne" },
    { mot: "kaomandy", indice: "Mpitarika miaramila", categorie: "moderne" },
    { mot: "tantsaha", indice: "Olona miasa tany, mpamboly", categorie: "moderne" },
    { mot: "mpamboly", indice: "Olona mamboly voly", categorie: "moderne" },
    { mot: "mpitsabo", indice: "Olona mitsabo marary", categorie: "moderne" },
    { mot: "fanafody", indice: "Zavatra ampiasaina hitsaboana aretina", categorie: "moderne" },
    { mot: "hopitaly", indice: "Toerana itsaboana marary", categorie: "moderne" },
    { mot: "dokotera", indice: "Mpitsabo nianatra fitsaboana", categorie: "moderne" },
    { mot: "fiarovana", indice: "Fikarakarana mba tsy ho voa", categorie: "moderne" },
    { mot: "vehivavy", indice: "Olona vavy efa lehibe", categorie: "moderne" },
    { mot: "lehilahy", indice: "Olona lahy efa lehibe", categorie: "moderne" },
    { mot: "rahalahy", indice: "Havana lahy iray tam-po", categorie: "moderne" },
    { mot: "fitaratra", indice: "Ampiasaina hijerena ny endrika", categorie: "moderne" },
    { mot: "fandriana", indice: "Ipetrahana sy anaterena", categorie: "moderne" },
    { mot: "vovonana", indice: "Ivon'ny zavatra iray", categorie: "moderne" },
    { mot: "tokotany", indice: "Faritra ivelan'ny trano", categorie: "moderne" },
    { mot: "tokotrano", indice: "Vondrona trano iray", categorie: "moderne" },
    { mot: "tetezana", indice: "Fitaovana famitana ony", categorie: "moderne" },
    { mot: "renirano", indice: "Rano mikoriana lehibe", categorie: "moderne" },
    { mot: "tafiotra", indice: "Rivotra mahery vaika", categorie: "moderne" },
    { mot: "atoandro", indice: "Ora anelanelan'ny maraina sy ny hariva", categorie: "moderne" },
    { mot: "antoandro", indice: "Fotoana mamiratra ny masoandro", categorie: "moderne" },
    { mot: "alarobia", indice: "Andro anelanelan'ny talata sy alakamisy", categorie: "moderne" },
    { mot: "alakamisy", indice: "Andro manaraka ny alarobia", categorie: "moderne" },
    { mot: "rehareha", indice: "Fireharehana amin'ny zavatra iray", categorie: "moderne" },
    { mot: "fahavalo", indice: "Olona tsy mifankatia aminao", categorie: "moderne" },
    { mot: "solosaina", indice: "Fitaovana elektrônika fikarohana", categorie: "moderne" },
    { mot: "fidirana", indice: "Fanombohana miditra toerana", categorie: "moderne" },
    { mot: "fivoahana", indice: "Fivoahana amin'ny toerana iray", categorie: "moderne" },
    { mot: "mpamorona", indice: "Olona mamorona zavatra vaovao", categorie: "moderne" },

    // ---- Sarotra (201-250) : mots ANCIENS mais encore utilisés aujourd'hui ----
    { mot: "ombiasa", indice: "Olona mahay fanaovam-body malagasy fahiny", categorie: "ancien" },
    { mot: "hasina", indice: "Hery tsy hita maso, natao manan-danja fahiny", categorie: "ancien" },
    { mot: "vintana", indice: "Anjara mombamomba ny fiainan'ny olona", categorie: "ancien" },
    { mot: "fady", indice: "Zavatra tsy azo atao araka ny lovantsofina", categorie: "ancien" },
    { mot: "tromba", indice: "Fanahin'ny razana miditra ao amin'ny olona", categorie: "ancien" },
    { mot: "sampy", indice: "Zavatra natao hiarovana fahiny", categorie: "ancien" },
    { mot: "andriana", indice: "Taranaky ny mpanjaka fahiny", categorie: "ancien" },
    { mot: "hova", indice: "Karazana saranga tamin'ny fanjakana fahiny", categorie: "ancien" },
    { mot: "famadihana", indice: "Fanovana lamba ny fasan-drazana", categorie: "ancien" },
    { mot: "ranakandriana", indice: "Fiantsoana havana amin'ny fomba fahiny", categorie: "ancien" },
    { mot: "vazimba", indice: "Vahoaka voalohany nipetraka teto Madagasikara", categorie: "ancien" },
    { mot: "tangalamena", indice: "Loholona mitondra fombafomba any atsimo", categorie: "ancien" },
    { mot: "hazomanga", indice: "Andry hazo fanaovana sorona any atsimo", categorie: "ancien" },
    { mot: "joro", indice: "Fombafomba fanaovana sorona", categorie: "ancien" },
    { mot: "razana", indice: "Ireo ntaolo efa maty, tena hajaina", categorie: "ancien" },
    { mot: "loholona", indice: "Olon-boafidy mitondra ny fokonolona fahiny", categorie: "ancien" },
    { mot: "mpitaiza", indice: "Olona mikarakara zaza araka ny fomba", categorie: "ancien" },
    { mot: "tsiny", indice: "Fahadisoana, araka ny finoana fahiny", categorie: "ancien" },
    { mot: "fomba", indice: "Lovantsofina arahin'ny razana", categorie: "ancien" },
    { mot: "ody", indice: "Zavatra natao fiarovana araka ny finoana fahiny", categorie: "ancien" },
    { mot: "sikidy", indice: "Fomba fanandroana amin'ny voanjo", categorie: "ancien" },
    { mot: "mpanandro", indice: "Olona mahay mamantatra ny andro tsara", categorie: "ancien" },
    { mot: "ohabolana", indice: "Fitenenana fahendren-drazana", categorie: "ancien" },
    { mot: "hainteny", indice: "Karazana tononkalo malagasy fahiny", categorie: "ancien" },
    { mot: "kabary", indice: "Kabary fanaovana amin'ny fotoam-panasana", categorie: "ancien" },
    { mot: "fanahy", indice: "Ilay tsy hita maso ao anaty vatana", categorie: "ancien" },
    { mot: "toko", indice: "Vato telo fanaovana afo fahiny", categorie: "ancien" },
    { mot: "angano", indice: "Tantara nomen-drazana am-bava", categorie: "ancien" },
    { mot: "valiha", indice: "Zava-maneno nentim-paharazana malagasy", categorie: "ancien" },
    { mot: "fanoharana", indice: "Fampitahana entina hampianarana hevitra", categorie: "ancien" },

    // ---- Tena sarotra (251-300) : mots ARCHAÏQUES, presque oubliés ----
    { mot: "andevo", indice: "Olona tsy afaka, saranga fahiny", categorie: "archaique" },
    { mot: "menakely", indice: "Faritany kely notarihin'ny andriana fahiny", categorie: "archaique" },
    { mot: "voromahery", indice: "Vorona ivon'ny fanjakana fahiny", categorie: "archaique" },
    { mot: "trimobe", indice: "Fikambanan'ny loholona fahiny", categorie: "archaique" },
    { mot: "fanjakan-tany", indice: "Fitondrana ara-drazana fahiny", categorie: "archaique" },
    { mot: "voninahitra", indice: "Haja avo natolotry ny fanjakana fahiny", categorie: "archaique" },
    { mot: "tsimandoa", indice: "Iraky ny mpanjaka fahiny", categorie: "archaique" },
    { mot: "lamban'andriana", indice: "Lamba manokana ho an'ny andriana fahiny", categorie: "archaique" },
    { mot: "fanompoana", indice: "Asa an-tery ho an'ny fanjakana fahiny", categorie: "archaique" },
    { mot: "vadin-tany", indice: "Governora fahiny amin'ny faritra iray", categorie: "archaique" },
    { mot: "solombavan-tany", indice: "Solontenan'ny vahoaka fahiny", categorie: "archaique" },
    { mot: "tandapa", indice: "Mpanompo akaikin'ny mpanjaka fahiny", categorie: "archaique" },
    { mot: "mpanjakabe", indice: "Fiantsoana ny mpanjaka lehibe indrindra fahiny", categorie: "archaique" }
];

/* =====================================================================
   BANQUE DÉDIÉE AU DÉFI QUOTIDIEN — volontairement séparée de WORD_BANK.
   Le défi ne doit jamais puiser dans la banque normale ni marquer ses
   mots comme "utilisés" pour la progression habituelle du joueur (les
   deux systèmes sont indépendants, y compris pour le contenu).
   ===================================================================== */
const DEFI_WORD_BANK = [
    { mot: "eny", indice: "Valiny milaza fanekena", categorie: "moderne" },
    { mot: "vola", indice: "Ilaina hividianana zavatra", categorie: "moderne" },
    { mot: "asa", indice: "Atao hahazoana karama", categorie: "moderne" },
    { mot: "trano", indice: "Toerana ipetrahana", categorie: "moderne" },
    { mot: "tsara", indice: "Mifanohitra amin'ny ratsy", categorie: "moderne" },
    { mot: "namana", indice: "Olona tia sy mifankatia", categorie: "moderne" },
    { mot: "fanjakana", indice: "Fitondrana ny firenena", categorie: "moderne" },
    { mot: "mpitondra", indice: "Olona mitantana ny fanjakana", categorie: "moderne" },
    { mot: "faritany", indice: "Fizarana ara-panjakana lehibe", categorie: "moderne" },
    { mot: "hasina", indice: "Hery tsy hita maso, natao manan-danja fahiny", categorie: "ancien" },
    { mot: "ohabolana", indice: "Fitenenana fahendren-drazana", categorie: "ancien" },
    { mot: "andriana", indice: "Taranaky ny mpanjaka fahiny", categorie: "ancien" },
    { mot: "tsimandoa", indice: "Iraky ny mpanjaka fahiny", categorie: "archaique" },
    { mot: "voninahitra", indice: "Haja avo natolotry ny fanjakana fahiny", categorie: "archaique" }
];

/* ---- Son (généré, pas de fichiers audio externes) ---- */
const SOUND_KEY = `tm_son_${GAME_ID}`;
const Sound = {
    ctx: null,
    isOn() { return localStorage.getItem(SOUND_KEY) !== 'off'; },
    toggle() {
        const next = this.isOn() ? 'off' : 'on';
        localStorage.setItem(SOUND_KEY, next);
        updateSoundIcon();
    },
    beep(freq, duration = 0.12, type = 'sine') {
        if (!this.isOn()) return;
        if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type;
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
        osc.connect(gain).connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    },
    correct() { this.beep(880, 0.15, 'triangle'); setTimeout(() => this.beep(1175, 0.2, 'triangle'), 120); },
    wrong() { this.beep(180, 0.2, 'sawtooth'); },
    tick() { this.beep(440, 0.05, 'square'); },
    hint() { this.beep(660, 0.1, 'sine'); }
};

function updateSoundIcon() {
    document.getElementById('btn-sound').innerHTML = Utils.icon(Sound.isOn() ? 'volume-on' : 'volume-off');
}

/* ---- Progression : plus haut niveau atteint par ce joueur, pour ce jeu ---- */
const PROGRESS_KEY = `tm_progress_${GAME_ID}_${currentUser.id}`;
function getSavedLevel() { return parseInt(localStorage.getItem(PROGRESS_KEY) || '1', 10); }
function saveLevel(n) { localStorage.setItem(PROGRESS_KEY, String(n)); }

/* ---- Niveau courant : ?niveau=N sinon progression sauvegardée ---- */
const urlParams = new URLSearchParams(window.location.search);
let niveauActuel = parseInt(urlParams.get('niveau') || getSavedLevel(), 10);
niveauActuel = Math.min(Math.max(niveauActuel, 1), Utils.MAX_NIVEAU);
const estDefi = urlParams.get('defi') === '1';

/* ---- État de la partie ---- */
let levelConfig, motCourant, indicesUtilises, tempsRestant, timerInterval, partieTerminee;

async function demarrerNiveau(n) {
    niveauActuel = n;
    levelConfig = Utils.getLevelConfig(n);

    // Verrouille l'UI pendant la sélection du mot (généralement instantané ;
    // ne prend un peu de temps que si le stock local est épuisé et qu'il
    // faut interroger le dictionnaire en ligne en dernier recours).
    const input = document.getElementById('answer-input');
    input.disabled = true;
    input.placeholder = 'Eny am-pikarohana teny...';
    document.getElementById('clue-text').textContent = '…';

    motCourant = estDefi
        ? Utils.pickWordForChallenge(n, DEFI_WORD_BANK)
        : await Utils.pickWordNoRepeat(GAME_ID, currentUser.id, n, WORD_BANK);

    indicesUtilises = 0;
    tempsRestant = levelConfig.tempsSecondes;
    partieTerminee = false;

    document.getElementById('niveau-label').textContent = `Haavo ${n} / ${Utils.MAX_NIVEAU}`;
    const badge = document.getElementById('badge-palier');
    badge.textContent = Utils.palierLabel(levelConfig.palier);
    badge.className = `badge-diff ${Utils.palierColorClass(levelConfig.palier)}`;

    document.getElementById('clue-text').textContent = motCourant.indice;
    document.getElementById('points-value').textContent = '0';
    document.getElementById('hint-count').textContent = Math.max(0, levelConfig.indicesAutorises - indicesUtilises);
    document.getElementById('timer-icon').innerHTML = Utils.icon('clock');
    document.getElementById('points-icon').innerHTML = Utils.icon('star');
    updateSoundIcon();

    renderSlots();
    updateTimerDisplay();

    input.value = '';
    input.disabled = false;
    input.placeholder = 'Soraty eto ny teny heverinao';
    input.focus();

    clearInterval(timerInterval);
    timerInterval = setInterval(tickTimer, 1000);
}

/* ---- Affichage des cases de lettres (quelques lettres pré-révélées selon la difficulté) ---- */
let lettresRevelees = [];
function renderSlots() {
    const mot = motCourant.mot;
    // Plus le niveau est dur, moins de lettres offertes au départ.
    const nbOffertes = levelConfig.palier === 'mora' ? 2 : (levelConfig.palier === 'antonony' ? 1 : 0);
    lettresRevelees = new Array(mot.length).fill(false);
    const indexesOfferts = Utils.seededShuffle([...mot].map((_, i) => i), niveauActuel).slice(0, nbOffertes);
    indexesOfferts.forEach(i => lettresRevelees[i] = true);

    const container = document.getElementById('word-slots');
    container.innerHTML = [...mot].map((c, i) =>
        `<div class="letter-slot ${lettresRevelees[i] ? 'revealed' : ''}" data-index="${i}">${lettresRevelees[i] ? c : ''}</div>`
    ).join('');
}

function tickTimer() {
    if (partieTerminee) return;
    tempsRestant--;
    updateTimerDisplay();
    if (tempsRestant <= 5 && tempsRestant > 0) Sound.tick();
    if (tempsRestant <= 0) {
        clearInterval(timerInterval);
        terminerPartie(false);
    }
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

/* ---- Indice (révèle une lettre, réduit le score potentiel) ---- */
document.getElementById('btn-hint').addEventListener('click', () => {
    if (partieTerminee) return;
    const restants = levelConfig.indicesAutorises - indicesUtilises;
    if (restants <= 0) { Utils.toast("Tsy manana fanampiana intsony ianao.", 'error'); return; }
    const indexesNonReveles = lettresRevelees.map((v, i) => v ? -1 : i).filter(i => i !== -1);
    if (!indexesNonReveles.length) return;
    const i = indexesNonReveles[Math.floor(Math.random() * indexesNonReveles.length)];
    lettresRevelees[i] = true;
    indicesUtilises++;
    Sound.hint();

    const slot = document.querySelector(`.letter-slot[data-index="${i}"]`);
    slot.textContent = motCourant.mot[i];
    slot.classList.add('revealed', 'hinted');
    document.getElementById('hint-count').textContent = Math.max(0, levelConfig.indicesAutorises - indicesUtilises);
});

/* ---- Soumission de la réponse ---- */
document.getElementById('answer-form').addEventListener('submit', (e) => {
    e.preventDefault();
    if (partieTerminee) return;
    const input = document.getElementById('answer-input');
    const reponse = input.value.trim().toLowerCase();
    if (!reponse) return;

    if (reponse === motCourant.mot.toLowerCase()) {
        clearInterval(timerInterval);
        terminerPartie(true);
    } else {
        Sound.wrong();
        const form = document.getElementById('answer-form');
        form.classList.remove('shake'); void form.offsetWidth; form.classList.add('shake');
        Utils.toast('Tsy izay ilay teny, andramo indray !', 'error');
    }
});

/* ---- Fin de partie (victoire ou défaite) ---- */
function terminerPartie(gagne) {
    partieTerminee = true;
    document.getElementById('answer-input').disabled = true;

    let points = 0, etoiles = 0, xp = 0;
    if (gagne) {
        Sound.correct();
        const bonusTemps = tempsRestant / levelConfig.tempsSecondes; // 0..1
        const penaliteIndice = 1 - (indicesUtilises / Math.max(1, levelConfig.indicesAutorises + 1)) * 0.4;
        points = Math.round(100 * levelConfig.multiplicateurPoints * (0.5 + bonusTemps * 0.5) * penaliteIndice);
        xp = Math.round(levelConfig.xpBase * (indicesUtilises === 0 ? 1 : 0.7));
        // Étoiles basées UNIQUEMENT sur les indices utilisés : une réussite
        // sans aucune aide donne toujours 3 étoiles, quel que soit le temps
        // restant exact (évite l'impression d'être "bloqué" à 2 étoiles).
        etoiles = indicesUtilises === 0 ? 3 : (indicesUtilises === 1 ? 2 : 1);

        if (estDefi) {
            // Défi quotidien : TOTALEMENT séparé de la progression générale.
            // Ni le score, ni l'XP/points du profil, ni le niveau sauvegardé
            // du jeu normal ne sont touchés — seules les stats de défi le sont.
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
        ? 'Nahita ilay teny nafenina ianao.'
        : 'Tsy nahita ilay teny tamin\'ny fotoana ianao.';

    document.getElementById('result-stars').innerHTML = gagne ? Utils.starsHTML(etoiles, 3) : '';
    document.getElementById('result-points').textContent = points;
    document.getElementById('result-xp').textContent = xp;
    document.getElementById('result-answer').textContent = `Ilay teny: ${motCourant.mot}`;

    // En mode défi, "Manaraka" doit enchaîner sur le jeu suivant du défi
    // (pas continuer la progression normale de Mot Nafenina).
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

/* ---- Son (bouton propre à ce jeu) ---- */
document.getElementById('btn-sound').addEventListener('click', Sound.toggle);

/* ---- Retour en haut ---- */
Utils.initBackToTop();

/* ---- Démarrage ---- */
demarrerNiveau(niveauActuel);
