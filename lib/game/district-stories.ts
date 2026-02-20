export type DistrictStory = {
  history: string;
  funFact: string;
  sourceUrl?: string;
};

export const DISTRICT_STORIES: Record<string, DistrictStory> = {
  D001: {
    history: 'Staré Město (původně Pražské město/Pragensis civitas, Větší město/Major civitas či Staré Město pražské/Antiqua civitas Pragensis, německy Altstadt) je historické město, městská čtvrť a katastrální území Prahy na pravém břehu Vltavy, o rozloze 129,03 ha, náležející k městské části Praha 1. Na východě a jihu Staré Město sousedí s Novým Městem, přičemž hranice vede po ulicích Revoluční, Náměstí Republiky, Na Příkopě, 28. října a Národní. Na severu a západě Staré Město uzavírá řeka Vltava, za kterou následují Holešovice (na severu), Malá Strana (na západě) a Smíchov (na jihozápadě). Staré Město dále svým územím jako enklávu zcela obklopuje nejmenší pražskou čtvrť Josefov. Součástí Starého Města je také Střelecký ostrov.',
    funFact: 'Na východě a jihu Staré Město sousedí s Novým Městem, přičemž hranice vede po ulicích Revoluční, Náměstí Republiky, Na Příkopě, 28.',
    sourceUrl: 'https://cs.wikipedia.org/wiki/Star%C3%A9_M%C4%9Bsto_(Praha)',
  },
  D002: {
    history: 'Nové Město (latinsky Nova Civitas, německy (Prager) Neustadt) je městská čtvrť a katastrální území Prahy na pravém břehu Vltavy, má rozlohu 3,34 km². Od založení Karlem IV. roku 1348 bylo Nové Město pražské královským městem, roku 1784 se stalo jednou ze čtyř čtvrtí sloučeného Královského hlavního města Prahy. Severní část patří do obvodu a městské části Praha 1, část jižně od hranice vedoucí po Jiráskově mostě, ulicích Myslíkově, Lazarské a Žitné (1,75 km²) do obvodu Praha 2 a malá část spadá do obvodu Praha 8 (bezprostřední okolí Těšnova a Florence).',
    funFact: 'Severní část patří do obvodu a městské části Praha 1, část jižně od hranice vedoucí po Jiráskově mostě, ulicích Myslíkově, Lazarské a Žitné (1,75 km²) do obvodu Praha 2 a malá část spadá do obvodu Praha 8 (bezprostřední okolí Těšnova a Florence).',
    sourceUrl: 'https://cs.wikipedia.org/wiki/Nov%C3%A9_M%C4%9Bsto_(Praha)',
  },
  D003: {
    history: 'Josefov (německy Josefsstadt) je městská čtvrť Prahy v ohybu Vltavy obklopená Starým Městem, součást městské části Praha 1. Josefov je také nejmenší pražské katastrální území o rozloze 8,81 ha. Od středověku zde bývalo Židovské Město (ghetto), které se po svém zrušení v polovině 19. století proměnilo v chudinskou čtvrť. Ta byla v rámci Pražské asanace zbourána a nahrazena novou zástavbou. Zachovány zůstaly jen nejvýznamnější židovské památky, Staronová a některé další synagogy, starý hřbitov a radnice. Původní katastr Josefova, existující do roku 1944, se skládal ze dvou oddělených enkláv – větší západní a malé východní.',
    funFact: 'Josefov je také nejmenší pražské katastrální území o rozloze 8,81 ha.',
    sourceUrl: 'https://cs.wikipedia.org/wiki/Josefov_(Praha)',
  },
  D004: {
    history: 'Malá Strana (původně Nové Město – latinsky Nova civitas sub castro Pragensi do založení dnešního Nového Města a později Menší Město pražské, německy Kleinseite) byla do roku 1784 samostatným městem, do roku 1949 městským obvodem Praha III, nyní je to jen městská čtvrť a katastrální území v centru Prahy na levém břehu Vltavy. Malá Strana má rozlohu 1,3728 km2. Skoro celá čtvrť se nachází na území městské části Praha 1, malá část (4 %) jižně od ulice Vítězné náleží k území Prahy 5. Jde o jednu z nejstarších a nejpůsobivějších částí Prahy vzniklou v podhradí Pražského hradu. Jedná se o turisticky atraktivní lokalitu s řadou kostelů, paláců a dalších památek a vysokým podílem zelených ploch zahrad a sadů včetně vrchu Petřína. Sídlí zde významné instituce státní moci (obě komory Parlamentu, Úřad vlády, tři ministerstva) a zastupitelské úřady.',
    funFact: 'Skoro celá čtvrť se nachází na území městské části Praha 1, malá část (4 %) jižně od ulice Vítězné náleží k území Prahy 5.',
    sourceUrl: 'https://cs.wikipedia.org/wiki/Mal%C3%A1_Strana',
  },
  D005: {
    history: 'Hradčany (německy Hradschin) jsou městská čtvrť a katastrální území Prahy o rozloze 1,5 km², rozdělené mezi městské obvody a zároveň městské části Praha 1 a Praha 6. Značnou část čtvrti zaujímá Pražský hrad, jeden z nejznámějších hradů Evropy a podle Guinnessovy knihy rekordů vůbec největší hradní komplex světa. Hradčany byly samostatným městem do roku 1784, kdy se staly součástí sjednoceného královského hlavního města Prahy.',
    funFact: 'Značnou část čtvrti zaujímá Pražský hrad, jeden z nejznámějších hradů Evropy a podle Guinnessovy knihy rekordů vůbec největší hradní komplex světa.',
    sourceUrl: 'https://cs.wikipedia.org/wiki/Hrad%C4%8Dany',
  },
  D006: {
    history: 'Vyšehrad je historické hradiště, hrad a pevnost v Praze, na skále nad pravým břehem řeky Vltavy na jižním okraji historického města, ve čtvrti Vyšehrad. Na Vyšehradském hřbitově se Slavínem u kostela sv. Petra a Pavla jsou pochovány významné české osobnosti, nachází se zde i nejstarší pražská rotunda sv. Martina. Dnes parkově upravený a veřejně přístupný areál je od roku 1962 národní kulturní památkou. K Vyšehradu se váže řada pověstí z počátků českých dějin, založil jej prý bájný kníže Krok. Skutečný vznik knížecího hradiště je kladen do druhé poloviny 10. století. Koncem 11. století zde sídlil první český král Vratislav I., který zřídil vyšehradskou kapitulu. Fakticky se Vyšehrad stal součástí Prahy za Karla IV., který jej přestavěl a napojil na opevnění nově založeného Nového Města. Roku 1420 hrad vypálili husité, v polovině 17. století byl v rámci rozšiřování opevnění města přestavěn na barokní pevnost. Od 15. do 19. století byl Vyšehrad s podhradím samosprávným městem, do roku 1848 podřízeným vyšehradské kapitule a připojeným k Praze roku 1883. V téže době došlo ke zřízení národního pohřebiště a k úpravám Vyšehradu do dnešní podoby. Roku 1904 byl vyšehradskou skálou proražen tunel, který otevřel pravobřežní komunikaci Prahy s jižním okolím.',
    funFact: 'Na Vyšehradském hřbitově se Slavínem u kostela sv.',
    sourceUrl: 'https://cs.wikipedia.org/wiki/Vy%C5%A1ehrad',
  },
  D007: {
    history: 'Vinohrady (do roku 1960 Královské Vinohrady, německy Königliche Weinberge) jsou od roku 1922 městská čtvrť a katastrální území hlavního města Prahy. Leží východně od Nového Města, na severu sousedí se Žižkovem, na východě se Strašnicemi, na jihu s Vršovicemi a na jihozápadě s Nuslemi. Pod názvem Viničné Hory byly od roku 1788 (resp. od zřízení samospráv roku 1849) samostatnou obcí, od roku 1867 přejmenovanou na Královské Vinohrady. Do roku 1875 zahrnovaly i území Žižkova. V letech 1879–1921 byly městem, před jejich připojením do tzv. Velké Prahy v roce 1922 byly (po Praze, Brně a Moravské Ostravě) čtvrtým největším městem na území dnešní České republiky a pátým největším městem Československa. Do roku 1921 byly okresním městem vinohradského okresu, který byl s jejich připojením k Praze zrušen. Do roku 1949 byly samostatným městským obvodem Praha XII, v roce 1949 byly rozděleny mezi dva a od roku 1960 dokonce mezi pět obvodů, zároveň se jejich západní část stala centrem nového obvodu Praha 2. Od roku 1960 se jmenují pouze Vinohrady.',
    funFact: 'Leží východně od Nového Města, na severu sousedí se Žižkovem, na východě se Strašnicemi, na jihu s Vršovicemi a na jihozápadě s Nuslemi.',
    sourceUrl: 'https://cs.wikipedia.org/wiki/Vinohrady_(Praha)',
  },
  D008: {
    history: 'Žižkov (německy Zischkaberg, Žižkow, Zizkow, v letech 1939–1945 Veitsberg, lidově dříve Žižkaperk) je městská čtvrť a katastrální území Prahy, nachází se na východ od jejího centra. Jako samostatný celek vznikl pod názvem Královské Vinohrady I. roku 1875 rozdělením Královských Vinohrad, roku 1877 byly Královské Vinohrady I. přejmenovány na Žižkov, roku 1881 byl Žižkov povýšen na město. V roce 1922 byl začleněn do nově vzniklé Velké Prahy. Od roku 1960 je téměř celý hlavní součástí městského obvodu Praha 3, jehož území je od roku 1990 i územím městské části Praha 3. Jedna žižkovská parcela náležející Domovu sociální péče Hagibor (poblíž stanice metra Želivského, východně od ul. Pod židovskými hřbitovy) patří do obvodu i městské části Praha 10. Neobydlená část prostoru mezi kolínskou a turnovskou železniční tratí, pod Krejcárkem (dříve zahrádkářská osada a průmyslové objekty, dnes Nové spojení), patří do obvodu i městské části Praha 8. Žižkov tvoří součást Městské památkové zóny Vinohrady, Žižkov, Vršovice.',
    funFact: 'Jako samostatný celek vznikl pod názvem Královské Vinohrady I.',
    sourceUrl: 'https://cs.wikipedia.org/wiki/%C5%BDi%C5%BEkov',
  },
  D009: {
    history: 'Nusle (dříve Nůsly, německy Nusle, Nusl, též Nussle) jsou městská čtvrť a katastrální území v Praze, jižně od centra města. Jejich součástí je čtvrť Pankrác. Spadají z větší části do obvodu a městské části Praha 4 a z menší části (Nuselské údolí a zástavba východně od Vyšehradu, v okolí Ostrčilova náměstí, Jaromírovy třídy s tramvajovou tratí, Nezamyslovy, Oldřichovy, Svatoplukovy, Sekaninovy, Spytihněvovy, Slavojovy, Krokovy a Lumírovy ulice) do obvodu a městské části Praha 2. Nuselská ulice Na Bučance mezi vyšehradskou pevností a Nuselským údolím za Kongresovým centrem již spadá do obvodu Praha 4. Nuslemi protéká pravostranný přítok řeky Vltavy, potok Botič.',
    funFact: 'Spadají z větší části do obvodu a městské části Praha 4 a z menší části (Nuselské údolí a zástavba východně od Vyšehradu, v okolí Ostrčilova náměstí, Jaromírovy třídy s tramvajovou tratí, Nezamyslovy, Oldřichovy, Svatoplukovy, Sekaninovy, Spytihněvovy, Slavojovy, Krokovy a Lumírovy ulice) do obvodu a městské části Praha 2.',
    sourceUrl: 'https://cs.wikipedia.org/wiki/Nusle',
  },
  D010: {
    history: 'Karlín (německy Karolinenthal) je městská čtvrť a katastrální území v městské části Praha 8 hlavního města Prahy. Leží v údolní nivě Vltavy mezi Libní a Novým Městem. Je vymezena oblastmi Vltava – Těšnov – úpatí vrchu Vítkov (železniční trať již Karlínu nepatří) – Švábky – Libeňský most. Obec Karlín byla založena roku 1817 na někdejším Špitálském poli – Špitálsku jako oficiální pražské předměstí, v letech 1903–1921 byl Karlín městem a k 1. lednu 1922 se stal součástí Velké Prahy.',
    funFact: 'Leží v údolní nivě Vltavy mezi Libní a Novým Městem.',
    sourceUrl: 'https://cs.wikipedia.org/wiki/Karl%C3%ADn',
  },
  D011: {
    history: 'Smíchov (německy Smichow) je městská čtvrť a katastrální území v Praze na levém břehu Vltavy, náležející do městské části Praha 5. Na severu sousedí s Malou Stranou, na jihu s Hlubočepy, na jihozápadě s Radlicemi. Smíchovský katastr vybíhá na západ severně podél Plzeňské ulice až po hranici s Motolem. Plzeňská ulice ve své horní části až na krátké úseky tvoří hranici mezi Smíchovem a Košířemi. Na protějším pravém břehu řeky se nacházejí od severu Nové Město, Vyšehrad a Podolí. Ke Smíchovu patří také velký vltavský ostrov Císařská louka (naproti Vyšehradu a Podolí) a Dětský ostrov. V letech 1903–1921 byl Smíchov městem, od roku 1838 měl status předměstí. V polovině 19. století byly součástí Smíchova také Košíře, které se později osamostatnily.',
    funFact: 'Na severu sousedí s Malou Stranou, na jihu s Hlubočepy, na jihozápadě s Radlicemi.',
    sourceUrl: 'https://cs.wikipedia.org/wiki/Sm%C3%ADchov',
  },
  D012: {
    history: 'Podolí je městská čtvrť a katastrální území v městské části Praha 4. Je zde evidováno 76 ulic a 1147 adres. Žije zde okolo 14 tisíc obyvatel. Název čtvrti je odvozen od umístění v údolí řeky. V Podolí se odehrává část děje pověsti o Bivojovi. První zmínka o obci Podolí pochází z listiny krále Přemysla Otakara I. z 16. prosince 1222. V té době se zde nacházel dvůr a přívoz vyšehradské kapituly a nedaleko leží osada Dvorce. Součástí Velké Prahy se Podolí stalo 1. ledna 1922. Společně s Braníkem a Hodkovičkami tvořily čtvrť Praha XV. Hlavními krajinnými dominantami Podolí jsou Kavčí hory a řeka Vltava. Mezi hlavní stavební dominanty náleží Podolská vodárna, Plavecký stadion, kostel sv. Michaela archanděla, Ústav pro péči o matku a dítě a budova České televize.',
    funFact: 'Název čtvrti je odvozen od umístění v údolí řeky.',
    sourceUrl: 'https://cs.wikipedia.org/wiki/Podol%C3%AD_(Praha)',
  },
  D013: {
    history: 'Braník (neoficiálně a v některých historických obdobích nazývaný též Bráník či Bránik; německy Branik) je městská čtvrť a katastrální území Prahy. Je součástí městské části Prahy 4. Čtvrť se nachází v jižní části města na pravém břehu řeky Vltavy. Spadá do ní i větší část sídliště Novodvorská.',
    funFact: 'Čtvrť se nachází v jižní části města na pravém břehu řeky Vltavy.',
    sourceUrl: 'https://cs.wikipedia.org/wiki/Bran%C3%ADk',
  },
  D014: {
    history: 'Holešovice (od sloučení s Bubny roku 1850 až do roku 1960 Holešovice-Bubny, německy Holleschowitz-Buben) jsou městská čtvrť a katastrální území v Praze. K Praze byly připojeny roku 1884 jako historicky první obec, která v době připojení nebyla městem. Před připojením k Praze náležely Holešovice do politického okresu Karlínského. Hlavní část Holešovic leží v tzv. Pražském meandru Vltavy na jejím levém břehu, k Holešovicím patří Bubny a na návrší čtvrť Letná. Téměř celé území náleží k městské části Praha 7, ale nepatrná část na jihozápadě (pobřeží Vltavy mezi Čechovým mostem a ulicí U plovárny s kaplí svaté Máří Magdaleny) náleží k městské části Praha 1.',
    funFact: 'K Praze byly připojeny roku 1884 jako historicky první obec, která v době připojení nebyla městem.',
    sourceUrl: 'https://cs.wikipedia.org/wiki/Hole%C5%A1ovice',
  },
  D015: {
    history: 'Bubeneč (česky původně Ovneč, později Oveneč a nejpozději od roku 1452 i Přední Ovenec, později Bubenč; německy Bubentsch, ale dříve i jinak, například Owenetz=Vorder) je městská čtvrť a katastrální území Prahy na levém břehu Vltavy. Součástí katastru Bubenče je i celý Císařský ostrov, Stromovka (Královská obora) a Výstaviště. Patří sem i fotbalový stadion Sparty a část Vítězného náměstí. Většina katastru Bubenče – 52 % – patří do obvodu a městské části Praha 7, ale většina zastavěné plochy leží v obvodu a městské části Praha 6, (v Praze 7 leží především Stromovka). V letech 1904–1921 byl Bubeneč samostatným městem, pak byl připojen k Praze.',
    funFact: 'Součástí katastru Bubenče je i celý Císařský ostrov, Stromovka (Královská obora) a Výstaviště.',
    sourceUrl: 'https://cs.wikipedia.org/wiki/Bubene%C4%8D',
  },
  D016: {
    history: 'Hodkovičky (německy Klein Hodowitz) jsou městská čtvrť a katastrální území v Praze o rozloze 208 ha. Patří do městské části Praha 4. Žije zde přes 3 tisíce obyvatel.',
    funFact: 'Patří do městské části Praha 4.',
    sourceUrl: 'https://cs.wikipedia.org/wiki/Hodkovi%C4%8Dky',
  },
  D017: {
    history: 'Troja (německy Troja) je bývalá vesnice a obec, nyní městská čtvrť a katastrální území Prahy. Katastrální území Troja má rozlohu 5,43 km2. Leží na pravém břehu řeky Vltavy a na přilehlém kopci (Bohnické plošině) na severu Prahy. Dolní část Troji v údolí Vltavy tvoří samosprávnou městskou část Praha-Troja a patří do obvodu Praha 7, horní část na Bohnické plošině patří k městské části Praha 8 a obvodu Praha 8.',
    funFact: 'Leží na pravém břehu řeky Vltavy a na přilehlém kopci (Bohnické plošině) na severu Prahy.',
    sourceUrl: 'https://cs.wikipedia.org/wiki/Troja',
  },
  D018: {
    history: 'Bohnice (německy Bochnitz) jsou městská čtvrť a katastrální území o rozloze 465,9 ha v městské části Praha 8 na pravém břehu Vltavy v severní části hlavního města ČR.',
    funFact: 'Bohnice (německy Bochnitz) jsou městská čtvrť a katastrální území o rozloze 465,9 ha v městské části Praha 8 na pravém břehu Vltavy v severní části hlavního města ČR.',
    sourceUrl: 'https://cs.wikipedia.org/wiki/Bohnice',
  },
  D019: {
    history: 'Kobylisy (německy Kobilis) jsou městská čtvrť a katastrální území na severu Prahy (MČ Praha 8), sousedící s Libní (J), Ďáblicemi (S), Střížkovem (V) a Čimicemi (Z). Východní část je tvořena panelovým sídlištěm (zhruba 10 tisíc obyvatel), západní část rodinnými domky. Na severu je Ďáblický háj, pokrývající kopec Ládví o nadmořské výšce cca 359 m. Mezi Kobylisy a Bohnicemi leží Čimický háj. Zástavba rodinných domů na severu Kobylis, vymezená ze západu ulicí Klapkovou a z jihu Veltěžskou, dříve nesla místopisné označení „Pod Ládvím též Nové Ďáblice“ a spolu s tzv. Seidlovou kolonií byla do roku 1951 součástí Ďáblic, přičemž k Ďáblicím dlouho náležely i další, dnes kobyliské pozemky, východně od této místní části.',
    funFact: 'Východní část je tvořena panelovým sídlištěm (zhruba 10 tisíc obyvatel), západní část rodinnými domky.',
    sourceUrl: 'https://cs.wikipedia.org/wiki/Kobylisy',
  },
  D020: {
    history: 'Čimice (německy Tschimitz) jsou městská čtvrť a katastrální území nacházející se na severním okraji Prahy. Čimice jsou součástí městské části Praha 8 a leží mírně stranou od hlavního pásu Severního města. Obklopuje je převážně příroda – ze západu přírodní památka Čimické údolí, ze severu Drahanské údolí, součást přírodního parku Drahaň-Troja, z východu pole, čtvrť Dolní Chabry a komerčně-průmyslová zóna Beranov a z jihu Psychiatrická nemocnice Bohnice, čtvrť Bohnice a Čimický háj.',
    funFact: 'Čimice jsou součástí městské části Praha 8 a leží mírně stranou od hlavního pásu Severního města.',
    sourceUrl: 'https://cs.wikipedia.org/wiki/%C4%8Cimice',
  },
  D021: {
    history: 'Dolní Chabry jsou městská čtvrť a katastrální území Prahy, tvořící území městské části Praha-Dolní Chabry v obvodu Praha 8. Je zde evidováno 66 ulic, 1089 adres a žije zde přes čtyři tisíce obyvatel. Dolní Chabry zahrnují celé původní Chabry, které byly od poloviny 16. století tvořeny dvěma osadami. Dolní Chabry měly centrum v okolí Bíleneckého náměstí a ulice Na Dolíku, Horní Chabry u dnešního Hrušovanského náměstí, původně návsi obklopené velkými usedlostmi, a ulic Na pěšině a Kobyliská. Do roku 1951 patřila do chaberského katastrálního území i část dnešních Kobylis, včetně závěrečného úseku tramvajové tratě u vozovny Kobylisy. Dolní Chabry sousedí na západě s Čimicemi, na jihu s Kobylisy, na východě s Ďáblicemi a s Březiněvsí; na severu pak s obcí Zdiby a její částí Brnky.',
    funFact: 'Je zde evidováno 66 ulic, 1089 adres a žije zde přes čtyři tisíce obyvatel.',
    sourceUrl: 'https://cs.wikipedia.org/wiki/Doln%C3%AD_Chabry',
  },
  D022: {
    history: 'Březiněves (německy Weiß Kratschen) byla do 30. června 1974 ves severně od Prahy, dnes je to městská čtvrť a katastrální území Prahy tvořící území městské části Praha-Březiněves v obvodě Praha 8. Je zde evidováno 29 ulic a 602 domů. Žije zde přes 1750 obyvatel. První zmínky o Březnovsi (původně Březina ves) pocházejí z 12. století. Historicky bývala obec obvykle majetkem bývalých církevních hodnostářů či soukromníků.',
    funFact: 'První zmínky o Březnovsi (původně Březina ves) pocházejí z 12.',
    sourceUrl: 'https://cs.wikipedia.org/wiki/B%C5%99ezin%C4%9Bves',
  },
  D023: {
    history: 'Ďáblice (německy Dablitz) jsou městská čtvrť a katastrální území Prahy, tvořící území městské části Praha-Ďáblice. Původně se jednalo o samostatnou vesnici, která byla roku 1968 připojena k Praze. Je zde evidováno 64 ulic a 853 adres. Žije zde přes tři tisíce obyvatel. Hlavní místní komunikace se jmenuje Ďáblická. Do území Ďáblic spadá část Ďáblického háje s vrchem Ládví (359 m n. m., přírodní památka Ládví) a hvězdárnou Ďáblice. Původně však patřil k Ďáblicím celý tento háj. Na území Ďáblic (směrem k Březiněvsi) je bývalá skládka Ďáblice. Podle Ďáblic se jmenuje sídliště Ďáblice, které však již leží na území Kobylis v městské části Praha 8. Velký Ďáblický hřbitov leží na území Střížkova, stejně jako tramvajová smyčka Sídliště Ďáblice a Zahradnictví Ďáblice. Pozemky v severní polovině tohoto sídliště náležely do roku 1960 k Ďáblicím.',
    funFact: 'Původně se jednalo o samostatnou vesnici, která byla roku 1968 připojena k Praze.',
    sourceUrl: 'https://cs.wikipedia.org/wiki/%C4%8E%C3%A1blice',
  },
  D024: {
    history: 'Libeň (německy Lieben) je městská čtvrť a katastrální území, tvořící jižní část pražské městské části Praha 8 a zasahující i do městských částí Praha 7 a Praha 9. Sousedí s Karlínem, Trojou, Kobylisy, Střížkovem, Prosekem, Vysočany a Žižkovem. Od Holešovic Libeň odděluje řeka Vltava. Tvoří severní a severovýchodní rozšíření centra metropole hlavního města Prahy, nazývané širší centrum. V minulosti díky svému členitému reliéfu patřila k nejromantičtějším pražským předměstím. Čtvrť se nachází mezi pražskými kopci Labuťka, Hájek, Sluncová, Vítkov, Ládví, Okrouhlík a Zámecký vrch, část Libně se nazývala Podviní. Protéká tudy potok Rokytka a tvoří údolí, v místě rozlivu směrem k Vltavě vytváří prostornou nivu. Ves Libeň je písemně doložena. Ve druhé polovině 19. století se změnila na průmyslové centrum severovýchodu Prahy. V letech 1898–1901 byla Libeň městem, v roce 1901 byla připojena k Praze jako její 8. čtvrť. Až do druhé světové války zde bylo rozsáhlé židovské město. Židovské stavby lze stále dohledat především ve Středí a Dolní Libni. Na území Libně byl podepsán tzv. Libeňský mír mezi Rudolfem II. a jeho bratrem Matyášem Habsburským (1608), byla tu provozována první předměstská tramvajová trať v Praze (1896) a uskutečnil se tu atentát na zastupujícího říšského protektora Reinharda Heydricha (1942), který zde i v nemocnici Na Bulovce zemřel. S Libní jsou provázaná jména spisovatele Bohumila Hrabala, výtvarníka Vladimíra Boudníka nebo básníka Karla Hlaváčka. V Horní Libni se nacházela slavná restaurace Na Vlachovce, která byla považován za jedno z tradičních míst setkávání příznivců dechové hudby v Praze, v únoru 2021 začala jeho plánovaná demolice. Ve střední Libni je nechvalně známý Discoland Sylvie. Polovinu Dolní Libně tvoří Palmovka a její okolí.',
    funFact: 'Sousedí s Karlínem, Trojou, Kobylisy, Střížkovem, Prosekem, Vysočany a Žižkovem.',
    sourceUrl: 'https://cs.wikipedia.org/wiki/Libe%C5%88',
  },
  D025: {
    history: 'Prosek (německy Prossek) je městská čtvrť a katastrální území, součást městské části Prahy 9. Sousedí s katastry Střížkov (západně, rozdělen mezi MČ Prahy 8 a Prahy 9), Letňany (severně, městská část Praha 18), Vysočany (jižně, součást městské části Prahy 9) a Libeň (jihozápadně, součást městské části Prahy 8).',
    funFact: 'Sousedí s katastry Střížkov (západně, rozdělen mezi MČ Prahy 8 a Prahy 9), Letňany (severně, městská část Praha 18), Vysočany (jižně, součást městské části Prahy 9) a Libeň (jihozápadně, součást městské části Prahy 8).',
    sourceUrl: 'https://cs.wikipedia.org/wiki/Prosek',
  },
  D026: {
    history: 'Střížkov (německy Strischkau) je městská čtvrť a katastrální území hlavního města Prahy, spadající zhruba napůl mezi městské obvody (a zároveň stejnojmenné městské části) Praha 8 a Praha 9. Do části Střížkova v Praze 8 spadá původní ves Střížkov a dále část Střížkova severozápadně od kapacitní ulice Liberecké vedené v terénním zářezu. V této části Střížkova je Ďáblický hřbitov, tramvajová smyčka Sídliště Ďáblice, Zahradnictví Ďáblice, nejvýchodnější část sídliště Ďáblice a autoservis (východně od ulice Ďáblické, kolem ulice Bešťákovy). Do střížkovské části Prahy 8 patří i areál Porsche na opačné straně ulice Liberecká. Do části Střížkova v Praze 9 spadá severozápadní polovina sídliště Prosek včetně škol, polikliniky a stanice metra a zástavba rodinných domků jižně od původní vsi Střížkov (s Libní hraničí ulicí Trojmezní, s Prosekem ulicí Na pokraji a navazující linií napříč zástavbou).',
    funFact: 'Do části Střížkova v Praze 8 spadá původní ves Střížkov a dále část Střížkova severozápadně od kapacitní ulice Liberecké vedené v terénním zářezu.',
    sourceUrl: 'https://cs.wikipedia.org/wiki/St%C5%99%C3%AD%C5%BEkov',
  },
  D027: {
    history: 'Hloubětín (německy Hlaupětin – jen do roku 1907?, v letech 1940–1945 Tiefenbach) je městská čtvrť a katastrální území v pražském městském obvodu Praha 9. Převážná část Hloubětína spadá do městské části Praha 14. Část západně od Průmyslového polookruhu (například Vozovna Hloubětín, Tesla Hloubětín, Hořejší rybník na Rokytce a zástavba kolem Jahodnické ulice), s výjimkou bloku u ulice Na obrátce patří do městské části Praha 9. Do městské části Praha 10 patří jen nepatrný pruh neobydlené a nezastavěné země mezi objektem Perlitu a Konstruktivy a železniční spojkou Malešice–Jahodnice západně od Průmyslové ulice.',
    funFact: 'Převážná část Hloubětína spadá do městské části Praha 14.',
    sourceUrl: 'https://cs.wikipedia.org/wiki/Hloub%C4%9Bt%C3%ADn',
  },
  D028: {
    history: 'Vysočany (německy Wissotschan) jsou městská čtvrť a katastrální území v městském obvodu Praha 9. Většina Vysočan leží na území městské části Praha 9, pouze malá část (sportovní areál a zahrádkářská kolonie Na Balkáně) patří k Praze 3. Katastrální území Vysočany sousedí s Prosekem, Letňany, Kbely, Hloubětínem, Hrdlořezy, Žižkovem a Libní. Mezi lety 1902–1921 byly Vysočany samostatným městem, v roce 1922 se staly součástí tzv. Velké Prahy.',
    funFact: 'Většina Vysočan leží na území městské části Praha 9, pouze malá část (sportovní areál a zahrádkářská kolonie Na Balkáně) patří k Praze 3.',
    sourceUrl: 'https://cs.wikipedia.org/wiki/Vyso%C4%8Dany',
  },
  D029: {
    history: 'Sedlec (německy Selz) je někdejší obec, dnes městská čtvrť a katastrální území hlavního města Prahy v obvodu Praha 6, rozkládající se u severního okraje Prahy na levém břehu Vltavy. V minulosti patřil k obci Lysolaje, před připojením k Praze roku 1922 byl samostatnou obcí. Při vzniku samosprávných městských částí v roce 1990 byl připojen k městské části Praha-Suchdol, v roce 2005 byla jádrová dolní část Sedlce odtržena a připojena k městské části Praha 6. Rozloha Sedlce je 145,56 ha, z toho asi dvě třetiny patří k městské částí Praha-Suchdol.',
    funFact: 'V minulosti patřil k obci Lysolaje, před připojením k Praze roku 1922 byl samostatnou obcí.',
    sourceUrl: 'https://cs.wikipedia.org/wiki/Sedlec_(Praha)',
  },
  D030: {
    history: 'Suchdol (dříve někdy i Sukdol, německy Sukdol) je městská čtvrť a katastrální území o rozloze 431,21 ha, rozkládající se na severu Prahy na levém břehu Vltavy a náležející od roku 1990 k městské části Praha-Suchdol, do níž spolu se Suchdolem patřil též Sedlec, od roku 2005 jen jeho horní část. K Praze byla původní obec Suchdol přičleněna 1. ledna 1968 jako součást obvodu Prahy 6. Suchdol si po připojení k Praze zachoval svůj místní národní výbor, který byl poté transformován v místní úřad a pak v úřad městské části.',
    funFact: 'K Praze byla původní obec Suchdol přičleněna 1.',
    sourceUrl: 'https://cs.wikipedia.org/wiki/Suchdol_(Praha)',
  },
  D031: {
    history: 'Lysolaje (německy Lisolei) jsou městská čtvrť a katastrální území a od 24. listopadu 1990 pod názvem Praha-Lysolaje také městská část na severu hlavního města Prahy o rozloze 247,54 ha. Území Lysolají sousedí s pražskými katastrálními územími Suchdolem na severu, Sedlcem na východě a s Dejvicemi na jihu. Na západě Lysolaje sousedí s obcí Horoměřice.',
    funFact: 'Území Lysolají sousedí s pražskými katastrálními územími Suchdolem na severu, Sedlcem na východě a s Dejvicemi na jihu.',
    sourceUrl: 'https://cs.wikipedia.org/wiki/Lysolaje',
  },
  D032: {
    history: 'Střešovice (dříve také Třešovice, Třesovice nebo Třebešice,, německy Streschowitz, dříve Střessowitz, Stressowitz, Tressowitz nebo Třessowitz) je městská čtvrť a katastrální území v Praze, součást městské části Praha 6. Střešovice se nacházejí v západní části Prahy vklíněné mezi čtvrtě Dejvice na severu, Hradčany na východě, Břevnov na jihu a jihozápadě, Veleslavín na západě a Vokovice na severozápadě.',
    funFact: 'Střešovice se nacházejí v západní části Prahy vklíněné mezi čtvrtě Dejvice na severu, Hradčany na východě, Břevnov na jihu a jihozápadě, Veleslavín na západě a Vokovice na severozápadě.',
    sourceUrl: 'https://cs.wikipedia.org/wiki/St%C5%99e%C5%A1ovice',
  },
  D033: {
    history: 'Kbely (německy Kbel) jsou městská čtvrť a katastrální území Prahy, tvořící území městské části Praha 19 (dřívější název Praha-Kbely). Je zde evidováno 78 ulic a 1043 adres. Žije zde přes sedm tisíc obyvatel. Na území Kbel se nachází vojenské letiště Kbely a menší částí svého areálu sem zasahuje také letiště Letňany.',
    funFact: 'Na území Kbel se nachází vojenské letiště Kbely a menší částí svého areálu sem zasahuje také letiště Letňany.',
    sourceUrl: 'https://cs.wikipedia.org/wiki/Kbely',
  },
  D034: {
    history: 'Letňany (německy Letnian) jsou městská čtvrť a katastrální území Prahy, které jako jediné tvoří území městské části Praha 18 (do roku 2001 Praha-Letňany). Leží v městském obvodě Praha 9 na okraji Polabské nížiny v blízkosti tzv. Pražského zlomu.',
    funFact: 'Leží v městském obvodě Praha 9 na okraji Polabské nížiny v blízkosti tzv.',
    sourceUrl: 'https://cs.wikipedia.org/wiki/Let%C5%88any',
  },
  D035: {
    history: 'Čakovice (německy Tschakowitz) jsou městská čtvrť a katastrální území Prahy. Je zde evidováno 63 ulic a 878 adres. Žije zde přibližně 8 800 obyvatel. Čakovice jsou jádrem městské části Praha-Čakovice, do které spolu s nimi spadají ještě Miškovice a Třeboradice.',
    funFact: 'Čakovice jsou jádrem městské části Praha-Čakovice, do které spolu s nimi spadají ještě Miškovice a Třeboradice.',
    sourceUrl: 'https://cs.wikipedia.org/wiki/%C4%8Cakovice',
  },
  D036: {
    history: 'Miškovice (německy Mischkowitz) jsou městská čtvrť a katastrální území Prahy. Je zde evidováno 19 ulic a 293 adres. Žije zde přes 1 tisíc obyvatel a je zde 361 domů. Jsou součástí městské části Praha-Čakovice v rámci správního obvodu Praha 18 (do října 2007 byly součástí správního obvodu Praha 19).',
    funFact: 'Žije zde přes 1 tisíc obyvatel a je zde 361 domů.',
    sourceUrl: 'https://cs.wikipedia.org/wiki/Mi%C5%A1kovice',
  },
  D037: {
    history: 'Třeboradice (německy Treboraditz) jsou městská čtvrť a katastrální území Prahy. Je zde evidováno 21 ulic a 233 adres. Ke dni 16. října 2006 bylo v Třeboradicích evidováno 702 obyvatel. Jsou součástí městské části Praha-Čakovice v rámci správního obvodu Praha 18 (do října 2007 byly součástí správního obvodu Praha 19). V Třeboradicích leží nejsevernější bod Prahy.',
    funFact: 'Jsou součástí městské části Praha-Čakovice v rámci správního obvodu Praha 18 (do října 2007 byly součástí správního obvodu Praha 19).',
    sourceUrl: 'https://cs.wikipedia.org/wiki/T%C5%99eboradice',
  },
  D038: {
    history: 'Satalice (německy Satalitz) jsou městská čtvrť a katastrální území Prahy. Žije zde přes dva tisíce obyvatel. K Praze byly připojeny roku 1974 a začleněny do městského obvodu Praha 9. 24. listopadu 1990 pak vznikla městská část Praha-Satalice. Je zde základní škola (ZŠ Satalice), která má kapacitu kolem 500 žáků, a dvě střední školy – Obchodní akademie Praha a 1. IT Gymnázium. Nacházejí se zde i malé obchůdky nebo asijská restaurace. Na zástavbu rodinných domů navazuje Satalická obora.',
    funFact: 'K Praze byly připojeny roku 1974 a začleněny do městského obvodu Praha 9.',
    sourceUrl: 'https://cs.wikipedia.org/wiki/Satalice',
  },
  D039: {
    history: 'Vinoř (německy Winor) je někdejší vesnice, od roku 1974 městská čtvrť a katastrální území Prahy, od 24. listopadu 1990 pod názvem Praha-Vinoř také městská část. Leží na severovýchodě hlavního města Prahy v severovýchodní části obvodu Praha 9, podél ulice Mladoboleslavské vedoucí směrem k Brandýsu nad Labem. Má rozlohu 599,92 ha, počet obyvatel k 1. lednu 2019 byl 4 071. Vinoř sousedí s Miškovicemi, Čakovicemi, Kbely, Satalicemi, Radonicemi, Jenštejnem, Podolankou a Přezleticemi',
    funFact: 'Leží na severovýchodě hlavního města Prahy v severovýchodní části obvodu Praha 9, podél ulice Mladoboleslavské vedoucí směrem k Brandýsu nad Labem.',
    sourceUrl: 'https://cs.wikipedia.org/wiki/Vino%C5%99',
  },
  D040: {
    history: 'Horní Počernice (německy Ober Potschernitz) jsou městská čtvrť a katastrální území Prahy, které je jedinou částí tvořící území městské části Praha 20 (do 31. prosince 2001 Praha-Horní Počernice). Leží v městském obvodu Praha 9, na východním okraji Prahy při silnici na Poděbrady. V letech 1969–1974 byly Horní Počernice městem. Rozlohou téměř 17 km² jsou největší pražskou čtvrtí.',
    funFact: 'Leží v městském obvodu Praha 9, na východním okraji Prahy při silnici na Poděbrady.',
    sourceUrl: 'https://cs.wikipedia.org/wiki/Horn%C3%AD_Po%C4%8Dernice',
  },
  D041: {
    history: 'Újezd nad Lesy (německy Aujest am Walde) je městská čtvrť a katastrální území hlavního města Prahy u jeho východní hranice. Jako jediná část města tvoří území samosprávné městské části Praha 21.',
    funFact: 'Jako jediná část města tvoří území samosprávné městské části Praha 21.',
    sourceUrl: 'https://cs.wikipedia.org/wiki/%C3%9Ajezd_nad_Lesy',
  },
  D042: {
    history: 'Klánovice (německy Klanowitz) jsou městská čtvrť a katastrální území v městském obvodě Praha 9, u východní hranice Prahy, bývalá osada (založena 1878), bývalá obec (1920–1974), část Prahy (od roku 1974). Praha-Klánovice je od roku 1990 název samosprávné městské části, jejímž územím je katastrální území Klánovice. Rozšířenou působnost státní správy pro ni vykonává úřad městské části Praha 21 (Újezd nad Lesy) v rámci svého správního obvodu. Ve 20. až 40. letech 20. století byly Klánovice významným centrem odpočinku pražské smetánky. Vedle Klánovických lázní z roku 1926 zde v období pomnichovské republiky a válečného protektorátu vyrostlo kvalitní golfové hřiště. Dnes je tato městská část místem luxusního rezidenčního bydlení. Zastavěná plocha Klánovic je na východě a západě ohraničena největší souvislou lesní plochou na území Prahy – přírodními rezervacemi Klánovický les a Cyrilov (dohromady tvoří přírodní park Klánovice-Čihadla). Na severu k území Klánovic přiléhá středočeská obec Šestajovice, jižní hranici s Újezdem nad Lesy tvoří rychlíková železniční trať.',
    funFact: 'Praha-Klánovice je od roku 1990 název samosprávné městské části, jejímž územím je katastrální území Klánovice.',
    sourceUrl: 'https://cs.wikipedia.org/wiki/Kl%C3%A1novice',
  },
  D043: {
    history: 'Běchovice (německy Biechowitz, Walhendorf (1353)) jsou městská čtvrť a katastrální území a od 24. listopadu 1990 pod názvem Praha-Běchovice také městská část hlavního města Prahy, o rozloze 683,39 ha. V Běchovicích každoročně začátkem podzimu startuje silniční běh Běchovice-Praha, pořádaný bez přerušení od roku 1897.',
    funFact: 'V Běchovicích každoročně začátkem podzimu startuje silniční běh Běchovice-Praha, pořádaný bez přerušení od roku 1897.',
    sourceUrl: 'https://cs.wikipedia.org/wiki/B%C4%9Bchovice',
  },
  D044: {
    history: 'Dolní Počernice (německy Unter Potschernitz) jsou městská čtvrť a katastrální území Prahy, tvořící území městské části Praha-Dolní Počernice, ve správním obvodu Praha 14. Je zde evidováno 52 ulic a 864 adres.',
    funFact: 'Je zde evidováno 52 ulic a 864 adres.',
    sourceUrl: 'https://cs.wikipedia.org/wiki/Doln%C3%AD_Po%C4%8Dernice',
  },
  D045: {
    history: 'Hostavice (německy Hostawitz) jsou bývalá vesnice, dnes městská čtvrť a katastrální území Prahy, součást městské části Praha 14 v městském obvodu Praha 9.',
    funFact: 'Hostavice (německy Hostawitz) jsou bývalá vesnice, dnes městská čtvrť a katastrální území Prahy, součást městské části Praha 14 v městském obvodu Praha 9.',
    sourceUrl: 'https://cs.wikipedia.org/wiki/Hostavice',
  },
  D046: {
    history: 'Kyje (německy Keeg) jsou městská čtvrť a katastrální území Prahy v městské části Praha 14, v obvodu Praha 9. Je zde evidováno 112 ulic a 1434 adres. Žije zde přibližně 9 tisíc obyvatel. Nejstarší a nejvýraznější stavební památkou je farní kostel sv. Bartoloměje. Jedná se o jednolodní románskou stavbu z první poloviny 13. století. Původní fara ze 14. století se nedochovala a současná stavba fary je z 18. století.',
    funFact: 'Nejstarší a nejvýraznější stavební památkou je farní kostel sv.',
    sourceUrl: 'https://cs.wikipedia.org/wiki/Kyje',
  },
  D047: {
    history: 'Černý Most (lidově Čerňák) je městská čtvrť a katastrální území v severovýchodní části Prahy, na území městské části Praha 14. Černý Most se skládá téměř výhradně z panelových sídlišť, mimo to se na jeho území nachází nákupní centrum Centrum Černý Most, jehož součástí je mimo jiné multikino Cinestar, hypermarket Globus a skoro dvě stě obchodů, IKEA a XXXLutz. Ve čtvrti leží dvě stanice trasy metra linky B, a to Rajská zahrada a konečná stanice Černý Most. Pás zeleně uprostřed sídliště má název Centrální park Černý Most.',
    funFact: 'Černý Most se skládá téměř výhradně z panelových sídlišť, mimo to se na jeho území nachází nákupní centrum Centrum Černý Most, jehož součástí je mimo jiné multikino Cinestar, hypermarket Globus a skoro dvě stě obchodů, IKEA a XXXLutz.',
    sourceUrl: 'https://cs.wikipedia.org/wiki/%C4%8Cern%C3%BD_Most',
  },
  D048: {
    history: 'Koloděje (2. p. Koloděj, německy Kolodei) jsou bývalá obec, nyní městská čtvrť a katastrální území Prahy, tvořící území městské části Praha-Koloděje. Jádro zástavby Koloděj má původní charakter vesnice, významným objektem je přilehlý zámek s oborou. Je zde evidováno 40 ulic a 400 adres. Žije zde zhruba 1500 obyvatel.',
    funFact: 'Koloděj, německy Kolodei) jsou bývalá obec, nyní městská čtvrť a katastrální území Prahy, tvořící území městské části Praha-Koloděje.',
    sourceUrl: 'https://cs.wikipedia.org/wiki/Kolod%C4%9Bje',
  },
  D049: {
    history: 'Hrdlořezy jsou městská čtvrť a katastrální území ve východní části města Prahy, kolem zákrutu Rokytky nedaleko vrchu Tábor. Prakticky celé území leží v obvodě a městské části Praha 9, pouze malý a pravděpodobně neobydlený proužek území zasahující do severovýchodního cípu areálu Teplárny Malešice je součástí Prahy 10.',
    funFact: 'Prakticky celé území leží v obvodě a městské části Praha 9, pouze malý a pravděpodobně neobydlený proužek území zasahující do severovýchodního cípu areálu Teplárny Malešice je součástí Prahy 10.',
    sourceUrl: 'https://cs.wikipedia.org/wiki/Hrdlo%C5%99ezy_(Praha)',
  },
  D050: {
    history: 'Malešice jsou městská čtvrť a katastrální území ve východní části města Prahy. Z převážné části jsou součástí obvodu a městské části Praha 10, pouze zahrady na západním úbočí vrchu Tábora v areálu zahradnické školy a v okolí patří do městské části Praha 9.',
    funFact: 'Z převážné části jsou součástí obvodu a městské části Praha 10, pouze zahrady na západním úbočí vrchu Tábora v areálu zahradnické školy a v okolí patří do městské části Praha 9.',
    sourceUrl: 'https://cs.wikipedia.org/wiki/Male%C5%A1ice',
  },
  D051: {
    history: 'Strašnice (německy Straschnitz) jsou od roku 1922 městská čtvrť a katastrální území Prahy. Jsou z převážné části součástí městského obvodu a městské části Praha 10, malá část Strašnic u hranic se Žižkovem (průmyslové a skladové areály Tesla Strašnice a Pramen Praha a tenisové dvorce v oblasti Třebešína) patří do obvodu a městské části Praha 3. Strašnice sousedí na západě s Vršovicemi a Vinohrady, na severozápadě s Žižkovem, na severovýchodě s Malešicemi, na východě s Hostivaří, na jihu se Záběhlicemi a na jihozápadě Michlí. Dne 30. října 2014 byla otevřena naučná stezka ve Strašnicích, která měří 3,5 km, má 11 zastavení a seznamuje návštěvníky s mnoha zajímavostmi z historie čtvrti. Na začátku stezky u stanice metra Strašnická je umístěn automatický výdejník letáků s informacemi o zajímavých místech na trase. Toto zařízení, které je napájeno sluneční energií, je prvním přístrojem tohoto druhu.',
    funFact: 'Jsou z převážné části součástí městského obvodu a městské části Praha 10, malá část Strašnic u hranic se Žižkovem (průmyslové a skladové areály Tesla Strašnice a Pramen Praha a tenisové dvorce v oblasti Třebešína) patří do obvodu a městské části Praha 3.',
    sourceUrl: 'https://cs.wikipedia.org/wiki/Stra%C5%A1nice',
  },
  D052: {
    history: 'Záběhlice (německy Sabechlitz) jsou městská čtvrť a katastrální území při toku Botiče na jihovýchodě Prahy. Záběhlice byly od románské doby tradiční zemědělskou vsí. Od poloviny 19. století do druhé světové války měly charakter dělnického předměstí s chudinskými koloniemi. Od roku 1922 jsou Záběhlice součástí Prahy. Ve 20. a 30. letech na okrajích území Záběhlic vznikly rozsáhlé čtvrti rodinných domků, Spořilov a Zahradní Město. Ty byly po druhé světové válce rozšířeny rozsáhlými panelovými sídlišti a začátkem 21. století ve východní části Novým Zahradním Městem. Staré Záběhlice a Zahradní Město patří do městské části i obvodu Praha 10, Spořilov do městské části a obvodu Praha 4. Vymezení Záběhlic jako katastrálního území se nepatrně liší od vymezení Záběhlic jako části obce (ZSJ Sídliště Spořilov I-východ se 4 adresami v části Kremnické ulice patří katastrálně k Michli, ale evidenčně k Záběhlicím).',
    funFact: 'Záběhlice byly od románské doby tradiční zemědělskou vsí.',
    sourceUrl: 'https://cs.wikipedia.org/wiki/Z%C3%A1b%C4%9Bhlice',
  },
  D053: {
    history: 'Michle (německy Michl) je městská čtvrť a katastrální území v Praze, jihovýchodně od centra, s jádrem v údolí Botiče a zahrnující i Kačerovský vrch s okolím. Převažující část patří do městské části Praha 4, pouze východní část vrchu Bohdalce a michelská část Slatin patří do městské části Praha 10. Vymezení Michle jako katastrálního území se nepatrně liší od vymezení Michle jako části obce (ZSJ Sídliště Spořilov I-východ se 4 adresami v části Kremnické ulice patří katastrálně k Michli, ale evidenčně k Záběhlicím).',
    funFact: 'Převažující část patří do městské části Praha 4, pouze východní část vrchu Bohdalce a michelská část Slatin patří do městské části Praha 10.',
    sourceUrl: 'https://cs.wikipedia.org/wiki/Michle',
  },
  D054: {
    history: 'Vršovice (německy Werschowitz) jsou městská čtvrť a katastrální území na jihovýchodě širšího centra Prahy, součást městské části i městského obvodu Praha 10. Sousedí na severu a severozápadě s Královskými Vinohrady, na východě se Strašnicemi, na jihovýchodě s Michlí a na jihozápadě s Nuslemi. Od roku 1885 byly městečkem, v letech 1902–1921 městem.',
    funFact: 'Sousedí na severu a severozápadě s Královskými Vinohrady, na východě se Strašnicemi, na jihovýchodě s Michlí a na jihozápadě s Nuslemi.',
    sourceUrl: 'https://cs.wikipedia.org/wiki/Vr%C5%A1ovice',
  },
  D055: {
    history: 'Hostivař (německy Hostiwar) je městská čtvrť a katastrální území v jihovýchodní části Prahy, které společně s Horními Měcholupy tvoří městskou část Praha 15. Patří do obvodu Praha 10 a správního obvodu Praha 15. Před připojením k Praze 1. ledna 1922 byla Hostivař samostatnou obcí ležící u Botiče (dříve Vinného potoka). Území Hostivaře je však mnohem větší a leží na něm několik celků vnímaných jako městské čtvrtě. Rozloha Hostivaře je 8,01 km2 (78 % městské části Praha 15), počet obyvatel v roce 2001 byl 15 438 (55,8 % z MČ Praha 15), v Hostivaři bylo 1345 domů a 8591 bytů.',
    funFact: 'Patří do obvodu Praha 10 a správního obvodu Praha 15.',
    sourceUrl: 'https://cs.wikipedia.org/wiki/Hostiva%C5%99',
  },
  D056: {
    history: 'Horní Měcholupy (německy Ober Miecholup) jsou městská čtvrť a katastrální území Prahy. Je zde evidováno 36 ulic a 571 adres. Žije zde asi 13 tisíc obyvatel. Horní Měcholupy jsou společně s Hostivaří součástí městské části Praha 15 a jsou sídlem jejího úřadu.',
    funFact: 'Horní Měcholupy jsou společně s Hostivaří součástí městské části Praha 15 a jsou sídlem jejího úřadu.',
    sourceUrl: 'https://cs.wikipedia.org/wiki/Horn%C3%AD_M%C4%9Bcholupy',
  },
  D057: {
    history: 'Dolní Měcholupy (německy Unter Miecholup) jsou městská čtvrť a katastrální území Prahy v obvodě Praha 10. V letech 1867–1968 byly samostatnou obcí, předtím byly součástí dnes zaniklé obce Měcholupy. Katastrální území tvoří území městské části Praha-Dolní Měcholupy. V katastrálním území Dolní Měcholupy je evidováno 45 ulic. Žije zde přes čtyři tisíce obyvatel. Praha-Dolní Měcholupy je městská část tvořená katastrálním územím Dolní Měcholupy. Působnost pověřeného úřadu pro městskou část Praha-Dolní Měcholupy vykonává městská část Praha 15.',
    funFact: 'V letech 1867–1968 byly samostatnou obcí, předtím byly součástí dnes zaniklé obce Měcholupy.',
    sourceUrl: 'https://cs.wikipedia.org/wiki/Doln%C3%AD_M%C4%9Bcholupy',
  },
  D058: {
    history: 'Petrovice (německy Petrowitz) je městská čtvrť a katastrální území hlavního města Prahy, které je totožné s územím městské části Praha–Petrovice. Vesnice Petrovice je doložená od 14. století, samostatnou obcí se stala roku 1920, k Praze byly Petrovice se zachováním vlastního místního národního výboru připojeny roku 1968 a od té doby jsou součástí obvodu Praha 10. Praha-Petrovice je od 24. listopadu 1990 městská část, která vznikla transformací působnosti předchozího místního národního výboru. Územím městské části je katastrální území Petrovice. Rozšířenou působnost státní správy pro tuto městskou část vykonává městská část Praha 15. Petrovice se rozkládají v jihovýchodním cípu hlavního města Prahy mezi Jižním Městem, Horními Měcholupy a Uhříněvsí, jádro původní vesnice leží na úbočí údolí Botiče. Rozlohou jsou nejmenší pražskou městskou částí, na ploše 1,79 km2 zde však žije zhruba 6 tisíc obyvatel. Z nich většina žije v sídlištní zástavbě, která vznikla na přelomu 80. a 90. let 20. století a tvoří jednotný komplex se sídlištěm Horní Měcholupy. Staré Petrovice se rozrůstají zejména na západ vilovou výstavbou.',
    funFact: 'Územím městské části je katastrální území Petrovice.',
    sourceUrl: 'https://cs.wikipedia.org/wiki/Petrovice_(Praha)',
  },
  D059: {
    history: 'Štěrboholy (německy Sterbohol) jsou městská čtvrť a katastrální území Prahy o rozloze 296,93 ha, které jako jediné tvoří městskou část Praha-Štěrboholy. Leží na území městského obvodu Praha 10. Přenesenou působnost státní správy zde vykonává městská část Praha 15 v rámci stejnojmenného správního obvodu.',
    funFact: 'Přenesenou působnost státní správy zde vykonává městská část Praha 15 v rámci stejnojmenného správního obvodu.',
    sourceUrl: 'https://cs.wikipedia.org/wiki/%C5%A0t%C4%9Brboholy',
  },
  D060: {
    history: 'Háje (německy Haj) jsou městská čtvrť a katastrální území na východě městské části Praha 11, kterou tvoří společně s Chodovem.',
    funFact: 'Háje (německy Haj) jsou městská čtvrť a katastrální území na východě městské části Praha 11, kterou tvoří společně s Chodovem.',
    sourceUrl: 'https://cs.wikipedia.org/wiki/H%C3%A1je',
  },
  D061: {
    history: 'Chodov (německy Chodau) je dnes městská čtvrť a katastrální území Prahy, nacházející se na území městské části Praha 11, kterou společně s Háji tvoří. Dříve samostatná a svébytná obec byla k Praze připojena v roce 1968. Od té doby se počet obyvatel vlivem výstavby komplexu sídliště Jižní Město zvýšil skoro třicetinásobně. Hustota zalidnění na Chodově dosahuje 7 217 obyvatel/km². Počet obyvatel Chodova po obrovských přírůstcích v 70. a 80. letech 20. století v posledních letech stagnuje.',
    funFact: 'Dříve samostatná a svébytná obec byla k Praze připojena v roce 1968.',
    sourceUrl: 'https://cs.wikipedia.org/wiki/Chodov_(Praha)',
  },
  D062: {
    history: 'Pitkovice (německy Pitkowitz) jsou městská čtvrť a katastrální území na jihovýchodním okraji hlavního města Prahy o rozloze 239,7 ha. Tvoří nejzápadnější část městské části Praha 22. Před rozsáhlou výstavbou v oblasti křižovatky ulic Žampionová a K Dálnici zde bylo evidováno pouze 8 ulic a 83 adres a žilo zde 197 obyvatel. Dnes zde žije přes 1 tisíc obyvatel, díky čemuž jsou po Uhříněvsi a Kolovratech nejpočetnějším katastrálním územím v Praze 22. Původně však mělo katastrální území Pitkovice rozlohu 248,5 ha. Historicky až do 19. prosince 2002 byly totiž součástí katastru Pitkovic i některé zastavěné pozemky o celkové rozloze 8,8 ha, které byly od 20. prosince 2002 převedeny do katastrálního území Křeslice.[zdroj?]',
    funFact: 'Tvoří nejzápadnější část městské části Praha 22.',
    sourceUrl: 'https://cs.wikipedia.org/wiki/Pitkovice',
  },
  D063: {
    history: 'Uhříněves (německy Aurschinewes) je městská čtvrť a katastrální území o rozloze 1027,1 ha, tvořící většinu území pražské městské části Praha 22. Od roku 1866 byla Uhříněves městysem, v letech 1913–1974 městem.',
    funFact: 'Od roku 1866 byla Uhříněves městysem, v letech 1913–1974 městem.',
    sourceUrl: 'https://cs.wikipedia.org/wiki/Uh%C5%99%C3%ADn%C4%9Bves',
  },
  D064: {
    history: 'Hájek u Uhříněvsi (jako část obce do 30. 6. 2016 pod názvem Hájek, německy Hajek) je městská čtvrť a katastrální území o rozloze 294,5 ha, rozkládající se na severovýchodě pražské městské části Prahy 22. Je zde evidováno 12 ulic a 130 adres. Roku 1969 se obec Hájek stala součástí města Uhříněvsi a s ním byla roku 1974 připojena k Praze. Hájek se nachází na samém okraji Prahy. V poslední době[kdy?] tu probíhá výstavba rodinných domů.',
    funFact: '2016 pod názvem Hájek, německy Hajek) je městská čtvrť a katastrální území o rozloze 294,5 ha, rozkládající se na severovýchodě pražské městské části Prahy 22.',
    sourceUrl: 'https://cs.wikipedia.org/wiki/H%C3%A1jek_u_Uh%C5%99%C3%ADn%C4%9Bvsi',
  },
  D065: {
    history: 'Krč (německy Krč nebo Krtsch, v letech 1939–1945 německy Reuth) je městská čtvrť a katastrální území hlavního města Prahy, součást městské části Praha 4 a městského obvodu Praha 4.',
    funFact: 'Krč (německy Krč nebo Krtsch, v letech 1939–1945 německy Reuth) je městská čtvrť a katastrální území hlavního města Prahy, součást městské části Praha 4 a městského obvodu Praha 4.',
    sourceUrl: 'https://cs.wikipedia.org/wiki/Kr%C4%8D',
  },
  D066: {
    history: 'Lhotka (německy Lhotka) je městská čtvrť a katastrální území Prahy spadající do městské části Praha 4 i městského obvodu Praha 4. K Praze byla připojena roku 1922 jako součást politické obce Hodkovičky (další část dnešního katastrálního území Lhotka byla připojena až v roce 1960). V roce 1988 byla část území oddělena a spolu s částmi dalších dvou katastrálních území vytvořila nové katastrální území Kamýk. Je zde evidováno 72 ulic a 599 adres. Žije zde zhruba 6 tisíc obyvatel.',
    funFact: 'K Praze byla připojena roku 1922 jako součást politické obce Hodkovičky (další část dnešního katastrálního území Lhotka byla připojena až v roce 1960).',
    sourceUrl: 'https://cs.wikipedia.org/wiki/Lhotka_(Praha)',
  },
  D067: {
    history: 'Kamýk (německy Kameik) je městská čtvrť a katastrální území v Praze, které bylo vytvořeno v roce 1988 rozhodnutím (účinnost od 1989) Národního výboru hl. města Prahy na úkor dosavadních katastrálních území Modřany, Lhotka a Libuš v rámci městského obvodu Praha 4. Dnes je k. ú. Kamýk součástí území městské části Praha 12. Název je odvozen z názvu kopce[zdroj?] a lesa, u něhož se čtvrť nachází.',
    funFact: 'Název je odvozen z názvu kopce[zdroj?] a lesa, u něhož se čtvrť nachází.',
    sourceUrl: 'https://cs.wikipedia.org/wiki/Kam%C3%BDk_(Praha)',
  },
  D068: {
    history: 'Libuš (německy Libusch) je městská čtvrť a katastrální území na jižním okraji Prahy tvořící menší část území městské části Praha-Libuš. Je zde evidováno 64 ulic a 825 adres. Žije zde zhruba pět tisíc obyvatel. Před připojením k Praze v roce 1968 byla Libuš obcí, v době připojení měla 1955 obyvatel. Podle Libuše je také pojmenovaná specializovaná meteorologická stanice Libuš (observatoř Libuš či Praha-Libuš) a meteorologická věž Libuš, přestože v aktuálním katastrálním a správním členění spadají do území Kamýku, před vznikem tohoto katastru do Libuše.',
    funFact: 'Před připojením k Praze v roce 1968 byla Libuš obcí, v době připojení měla 1955 obyvatel.',
    sourceUrl: 'https://cs.wikipedia.org/wiki/Libu%C5%A1',
  },
  D069: {
    history: 'Písnice (německy Piesnitz) je městská čtvrť a katastrální území na jihu Prahy, tvořící od 24. listopadu 1990 součást městské části Praha-Libuš. Byla samostatnou obcí až do připojení k Praze v roce 1974, kdy byla zároveň podřízena MNV Praha-Libuš. Je zde evidováno 42 ulic a 496 adres. Na rozloze 3,67 km² zde trvale žije asi 4 tisíce obyvatel.',
    funFact: 'Byla samostatnou obcí až do připojení k Praze v roce 1974, kdy byla zároveň podřízena MNV Praha-Libuš.',
    sourceUrl: 'https://cs.wikipedia.org/wiki/P%C3%ADsnice',
  },
  D070: {
    history: 'Kunratice (německy Kunratitz, též Kundratitz) jsou městská čtvrť a katastrální území hlavního města Prahy v obvodu Praha 4, na jihovýchodním okraji města, do roku 1968 byly samostatnou obcí Kunratice u Prahy. Tvoří hlavní část městské části Praha-Kunratice, k 1. červenci 2014 byla upravena hranice samosprávných městských částí Praha-Šeberov a Praha-Kunratice v okolí Kunratické spojky tak, že přestala odpovídat hranici katastrálních území Šeberov a Kunratice a vznikly tak v řídce zastavěném území oboustranné přesahy. Mají rozlohu 8,0985 km². V roce 2017 zde bylo evidováno 143 ulic a 2075 adres. Pro tuto čtvrť je charakteristické obklopení jednou z největších pražských ploch lesní zeleně, Kunratickým lesem. Jejím jádrem je historický komplex barokního kunratického zámku se zámeckým parkem uvnitř zástavby.',
    funFact: 'Tvoří hlavní část městské části Praha-Kunratice, k 1.',
    sourceUrl: 'https://cs.wikipedia.org/wiki/Kunratice_(Praha)',
  },
  D071: {
    history: 'Šeberov (německy Scheberau) je městská čtvrť a katastrální území hlavního města Prahy v obvodu Praha 4. Tvoří hlavní část městské části Praha-Šeberov, k 1. červenci 2014 byla upravena hranice samosprávných městských částí Praha-Šeberov a Praha-Kunratice v okolí Kunratické spojky tak, že přestala odpovídat hranici katastrálních území Šeberov a Kunratice a vznikly tak v řídce zastavěném území oboustranné přesahy.. Od roku 1909 byl Šeberov samostatnou obcí, 1. července 1974 byl z okresu Praha-západ připojen k Praze. Šeberov se skládá ze dvou původních sídel – Šeberova na severu a Hrnčířů na jihu, tato sídla zatím nejsou srostlá zástavbou. Území je zhruba vymezeno na severu ulice Na Jelenách, na východě dálnicí D1, západní hranice je v oblasti Kunratické spojky a jižní hranice tvoří hranici Prahy. Počet obyvatel Šeberova se zvyšuje vlivem výstavby nových domů, typických pro aglomeraci a okrajové části metropole.',
    funFact: 'Tvoří hlavní část městské části Praha-Šeberov, k 1.',
    sourceUrl: 'https://cs.wikipedia.org/wiki/%C5%A0eberov',
  },
  D072: {
    history: 'Křeslice jsou městská čtvrť a katastrální území na jihovýchodním okraji hlavního města Prahy, tvořící území městské části Praha-Křeslice v obvodu Praha 10. Je zde evidováno 29 ulic a 350 adres, žije zde zhruba tisíc obyvatel. Městská část Praha-Křeslice má vlastní samosprávu (zastupitelstvo). Státní správu v přenesené působnosti pro Křeslice vykonává úřad městské části Praha 11 Jižní Město. Praha-Křeslice a Praha-Zličín jsou jediné dvě městské části v Praze, které narušují skladebnost mezi správními obvody Prahy (Praha 1–22) a územními obvody Prahy (Praha 1–10).',
    funFact: 'Je zde evidováno 29 ulic a 350 adres, žije zde zhruba tisíc obyvatel.',
    sourceUrl: 'https://cs.wikipedia.org/wiki/K%C5%99eslice',
  },
  D073: {
    history: 'Komořany (německy Komoran) jsou bývalá vesnice, dnes městská čtvrť a katastrální území Prahy, součást městské části Praha 12.',
    funFact: 'Komořany (německy Komoran) jsou bývalá vesnice, dnes městská čtvrť a katastrální území Prahy, součást městské části Praha 12.',
    sourceUrl: 'https://cs.wikipedia.org/wiki/Komo%C5%99any_(Praha)',
  },
  D074: {
    history: 'Modřany (německy Moderschan) jsou od 1. ledna 1968 částí Prahy, dnes jsou městská čtvrť a katastrální území městské části Praha 12, jejíž úřad na území Modřan sídlí. Jejich historie sahá až k 11. století. Dne 13. listopadu 1936 byly povýšeny na městys, 14. června 1964 k nim byly připojeny Komořany a někdy v roce 1963 či 1966 byl modřanský místní národní výbor přejmenovaný na městský národní výbor, což se fakticky rovnalo povýšení na město.',
    funFact: 'Jejich historie sahá až k 11.',
    sourceUrl: 'https://cs.wikipedia.org/wiki/Mod%C5%99any',
  },
  D075: {
    history: 'Točná (německy Totschna) je městská čtvrť a katastrální území Prahy o rozloze 462,6 ha, které spadá do městské části Praha 12. Leží jihozápadně od Cholupic a severozápadně od obce Dolní Břežany. Je zde evidováno 31 ulic a 413 adres. Stav obyvatel k 31. 12. 2017 byl 790 lidí. Obec leží u vrchu Čihadlo o nadmořské výšce 388 metrů, který je nejvyšším místem Prahy 12 a představuje nejvýchodnější a nejsevernější výspu geomorfologického celku Brdská vrchovina v níž tak leží i polovina Točné. Na Čihadle se nachází bývalý vojenský prostor 11. protiletadlového raketového oddílu 71. protiletadlové raketové brigády protivzdušné obrany hlavního města Prahy. Část areálu byla renovována a je využívána jako školící středisko Vysoké školy ekonomické v Praze. V další části areálu se nachází Airsoftové hřiště Točná. Na úpatí Čihadla směrem u Hrazanské ulice směrem k Cholupicím se nachází takzvaný „Palpost“, kde na přelomu 50. a 60. let býval vojenský prostor palebného postavení (pal. post.) - protiletadlové dělostřelecké baterie Točná. Druhým výrazným vrchem jsou Šance také se 385 m n. m.(nejvyšší bod laténských valů), který byl spolu se sousedním vrchem Hradiště součástí kulturní památky – keltského oppida Závist. Na vrchu Šance se nachází přírodní rezervace, kterou vede naučná stezka zaměřená na chráněné druhy živočichů a rostlin místních skalnatých svahů i na starověké osídlení oblasti. Na jižním svahu Šancí směrem ke Břežanskému údolí (chráněné území značené jako evropsky významná lokalita – v katastru Točné zasahuje do hranic přírodní rezervace Šance) je pamětní deska věnovaná známému českému entomologovi Františku Antonínu Nickerlovi (obnovená roku 2013 z iniciativy PhDr. Jiřího Tichoty), který se zde často věnoval svému výzkumu motýlů. V severní části území Točné, pod samotou Nouzov v lokalitě zvané Velká lada se nachází sportovní letiště Praha-Točná. Jako letiště pro bezmotorové sportovní létání bylo otevřeno 31. března 1946, přestože se na tomto místě první let kluzáku uskutečnil již roku 1932 a plachtaři zde létali již před válkou. Zpočátku se létalo z vrchu Čihadlo a startovalo se od Nouzova, později došlo k výstavbě skutečného letiště na plošině zvané Valká Lada pod Nouzovem. Od roku 2010 je letiště v soukromém vlastnictví a v jeho hangárech se nachází sbírka letuschopných historických letadel, mezi nimiž je i Lockheed Electra 10A (OK-CTB, výr. č. 1091), bývalý letoun významného českého podnikatele Jana Antonína Bati. V jižní části katastru Točné na pomezí Točenské rokle a Břežanského údolí u ústí Točenského potoka do Břežanského potoka se nachází trampská osada Na Place. Točná má svůj vlastní fotbalový klub TJ Točná, Za zmínku stojí i BikePark Točná, který se nachází mezi Nouzovem a točenským letištěm, trošku paradoxně v úzkém výběžku katastru obce Cholupice. Z významných osobností bydlel na Točné např. podplukovník Ladislav Bedřich, Karel Pech, PhDr. Jiří Tichota, Jiří Kodet a jeho dcera Barbora Kodetová. Svůj domek si zde rovněž postavila i cvičitelka Hana Kynychová. Území Točné protíná mezi osadou a letištěm východo-západním směrem Pražský okruh, který se na území Točné (severně od vesnice) zanořuje do Komořanského tunelu (4. nejdelší silniční tunel v ČR). Jezdí zde autobusy linek č. 113 a č. 341.',
    funFact: 'Leží jihozápadně od Cholupic a severozápadně od obce Dolní Břežany.',
    sourceUrl: 'https://cs.wikipedia.org/wiki/To%C4%8Dn%C3%A1',
  },
  D076: {
    history: 'Cholupice (německy Cholupitz) jsou městská čtvrť a katastrální území Prahy, součást městské části Praha 12. Je zde evidováno 18 ulic a 165 adres. Žije zde zhruba 600 obyvatel. Okolo Cholupic vede vnější silniční obchvat, tzv. Pražský okruh. Západně od obce se nachází sportovní letiště Točná.',
    funFact: 'Okolo Cholupic vede vnější silniční obchvat, tzv.',
    sourceUrl: 'https://cs.wikipedia.org/wiki/Cholupice',
  },
  D077: {
    history: 'Zbraslav (německy Königsaal) je evidenční část a katastrální území na jihu Prahy, též bývalé město. Zbraslav má bohatou historii, která sahá až do doby kamenné. Od konce 13. století nabyla Zbraslav na důležitosti, když se v nově zbudovaném cisterciáckém klášteře začali pohřbívat členové vládnoucí přemyslovské dynastie. Pro krásnou přírodu a dlouhou historii si Pražané začali v 2. polovině 19. století Zbraslavi všímat a pravidelně ji navštěvovat. Zbraslav vznikla sloučením obcí Zbraslav, Záběhlice a Žabovřesky. Mimo zástavby těchto tří obcí zde dále existují osady Baně, Strnady a Závist. Téměř celé území Zbraslavi se rozkládá mezi levým břehem Vltavy a pravým břehem Berounky, pouze územní část Závist zasahuje i na pravý břeh Vltavy, kde se nachází i nádraží Praha-Zbraslav na železniční trati 210 Praha-Čerčany-Dobříš. Pravý a levý břeh Vltavy zde propojuje silniční most Závodu míru. Praha-Zbraslav je od roku 1990 městskou částí tvořenou katastrálními územími Zbraslav a Lahovice. Městská část je součástí obvodu Praha 5. Rozšířenou přenesenou působnost pro ni vykonává sousední městská část Praha 16 (Radotín) v rámci správního obvodu Praha 16.',
    funFact: 'Zbraslav má bohatou historii, která sahá až do doby kamenné.',
    sourceUrl: 'https://cs.wikipedia.org/wiki/Zbraslav',
  },
  D078: {
    history: 'Radotín (německy Radotin) je městská čtvrť a katastrální území o rozloze 930,69 ha, které jako jediné tvoří pražskou městskou část Praha 16. Radotín se rozkládá na levém břehu Berounky, na jihozápadě hlavního města Prahy. Zastavěná část území je ohraničena na západě a severu zalesněnými kopci Velký a Malý háj a na jihovýchodě řekou Berounkou. Mezi oběma kopci protéká Radotínský potok. V letech 1967–1974 byl Radotín městem.',
    funFact: 'Radotín se rozkládá na levém břehu Berounky, na jihozápadě hlavního města Prahy.',
    sourceUrl: 'https://cs.wikipedia.org/wiki/Radot%C3%ADn',
  },
  D079: {
    history: 'Velká Chuchle (německy Groß Kuchel) je městská čtvrť a katastrální území hlavního města Prahy o rozloze 460,3 ha rozkládající se na jihozápadě Prahy na levém břehu Vltavy, tvořící od 24. listopadu 1990 větší jižní část městské části Praha-Velká Chuchle. Je zde evidováno 41 ulic a 500 adres. Čtvrtí protéká menší přítok Vltavy, potok Vrutice.',
    funFact: 'Čtvrtí protéká menší přítok Vltavy, potok Vrutice.',
    sourceUrl: 'https://cs.wikipedia.org/wiki/Velk%C3%A1_Chuchle',
  },
  D080: {
    history: 'Malá Chuchle (německy Kuchelbad) je městská čtvrť a katastrální území hlavního města Prahy na levém břehu Vltavy, mezi Hlubočepy a Velkou Chuchlí, v městské části Praha-Velká Chuchle. Před připojením k Praze v roce 1922 byla Malá Chuchle součástí obce Velká Chuchle, Velká Chuchle však byla připojena k Praze až roku 1968.',
    funFact: 'Před připojením k Praze v roce 1922 byla Malá Chuchle součástí obce Velká Chuchle, Velká Chuchle však byla připojena k Praze až roku 1968.',
    sourceUrl: 'https://cs.wikipedia.org/wiki/Mal%C3%A1_Chuchle',
  },
  D081: {
    history: 'Hlubočepy (německy Kohlfelden) jsou městská čtvrť a katastrální území na jihu pražské městské části Praha 5.',
    funFact: 'Hlubočepy (německy Kohlfelden) jsou městská čtvrť a katastrální území na jihu pražské městské části Praha 5.',
    sourceUrl: 'https://cs.wikipedia.org/wiki/Hlubo%C4%8Depy',
  },
  D082: {
    history: 'Holyně (německy Hollin) je městská čtvrť a katastrální území Prahy. Leží v městské části Praha-Slivenec v obvodu Praha 5. Je zde evidováno 21 ulic a 205 adres. Žije zde asi 500 obyvatel.',
    funFact: 'Leží v městské části Praha-Slivenec v obvodu Praha 5.',
    sourceUrl: 'https://cs.wikipedia.org/wiki/Holyn%C4%9B',
  },
  D083: {
    history: 'Slivenec (německy Sliwenetz) je městská čtvrť a katastrální území Prahy. Je zde evidováno 51 ulic, 970 adres a žijí zde asi 3 tisíce obyvatel. Je jádrem samosprávné městské části Praha-Slivenec, ke které patří ještě Holyně. Již od středověku se nedaleko těží růžový vápenec zvaný slivenecký mramor. V centru Slivence se kolem náměstíčka nachází kostel Všech svatých a Křižovnický dvůr.',
    funFact: 'Je zde evidováno 51 ulic, 970 adres a žijí zde asi 3 tisíce obyvatel.',
    sourceUrl: 'https://cs.wikipedia.org/wiki/Slivenec',
  },
  D084: {
    history: 'Lochkov (německy Lochkow) je městská čtvrť a katastrální území a od 24. listopadu 1990 pod názvem Praha-Lochkov také městská část na jihozápadě hlavního města Prahy. Je zde evidováno 18 ulic a 234 adres. Žije zde přes 600 obyvatel. K Praze byla původně samostatná obec připojena roku 1974 a začleněna do obvodu Praha 5. 24. listopadu 1990 byla ustavena samostatná městská část Praha-Lochkov.',
    funFact: 'K Praze byla původně samostatná obec připojena roku 1974 a začleněna do obvodu Praha 5.',
    sourceUrl: 'https://cs.wikipedia.org/wiki/Lochkov',
  },
  D085: {
    history: 'Lahovice (německy Lahowitz) jsou městská čtvrť a katastrální území na jihu Prahy, tvořící od 24. listopadu 1990 severní část městské části Praha-Zbraslav. Území Lahovic má rozlohu 202,77 ha a rozkládá se na levém břehu Vltavy při jejím soutoku s Berounkou. Osada Lahovice leží v klínu mezi Vltavou a Berounku, tj. na pravém břehu Berounky. Do katastrálního území Lahovic spadá i osada Lahovičky, ležící severněji, na protilehlém, levém břehu Berounky. Vlastní Lahovice (tj. část na pravém břehu Berounky) jsou statisticky vedeny jako jedna základní sídelní jednotka, území Lahoviček je rozděleno na dvě základní sídelní jednotky: ZSJ Lahovičky tvoří vlastní osada, ZSJ Lahovičky-soutok tvoří pobřežní pás od radotínského přístavu až k modřanskému jezu a k tomu oblast západně od obytné zástavby Lahoviček. Oblast v okolí přístavu, nyní bez obytných budov, je zmiňována jako osada Lebedov. Lahovice i Lahovičky leží při Strakonické ulici, což je významná výpadová radiála (označovaná též jako Chuchelská radiála), která je pražským pokračováním silnice I/4 od Strakonic a Příbrami.',
    funFact: 'Území Lahovic má rozlohu 202,77 ha a rozkládá se na levém břehu Vltavy při jejím soutoku s Berounkou.',
    sourceUrl: 'https://cs.wikipedia.org/wiki/Lahovice',
  },
  D086: {
    history: 'Lipence (německy Lipenetz) jsou městská čtvrť a katastrální území v Praze, tvořící území městské části Praha-Lipence. Je zde evidováno 58 ulic, přibližně 900 čísel popisných a 900 čísel evidenčních. Žije zde přes tři tisíce obyvatel. Lipence leží větší částí území na nivě na pravém břehu Berounky v západní části nejjižnějšího výběžku Prahy. Na východě a severovýchodě sousedí s pražskou čtvrtí Zbraslav, na severozápadě a západě tvoří Berounka hranici s Radotínem a Černošicemi, na jihu sousedí s lesními partiemi katastrálního území obce Jíloviště na severním úbočí vrchu Kopanina (Brdská vrchovina), známějšího pod názvem Cukrák. V poslední době se do této části Prahy stěhuje stále více lidí, zvláště mladších rodin, a probíhá výstavba rodinných domků, silně využívány jsou i rekreační objekty v chatových osadách, z nichž nejznámější je osada Kazín u stejnojmenného skalního ostrohu u Berounky. Důvodem přílivu obyvatel i rekreantů je kromě nižších cen méně narušené prostředí, nezastavěné přírodní plochy i blízkost lesů (severní část Brd – Hřebeny) i relativně nespoutaná Berounka.',
    funFact: 'Je zde evidováno 58 ulic, přibližně 900 čísel popisných a 900 čísel evidenčních.',
    sourceUrl: 'https://cs.wikipedia.org/wiki/Lipence',
  },
  D087: {
    history: 'Zadní Kopanina (německy Hinter Kopanin) je městská čtvrť a katastrální území v rámci hlavního města Prahy. Je zde evidováno 5 ulic (Chaloupky, K Zadní Kopanině, Na Zmrzlíku, Kavylová a U Skopců) a 36 adres.',
    funFact: 'Je zde evidováno 5 ulic (Chaloupky, K Zadní Kopanině, Na Zmrzlíku, Kavylová a U Skopců) a 36 adres.',
    sourceUrl: 'https://cs.wikipedia.org/wiki/Zadn%C3%AD_Kopanina',
  },
  D088: {
    history: 'Řeporyje (poněmčeně Řepora a v letech 1939–1945 německy Rübstich) jsou od roku 1974 městská čtvrť a katastrální území Prahy. Nacházejí se na jihozápadním okraji Prahy, na počátku Dalejského údolí, které se odtud rozkládá podél Dalejského potoka. Většina jejich území patří do městské části Praha-Řeporyje s výjimkou malé neobydlené části severně od Poncarovy ulice a jižně od Krtně, která patří do městské části Praha 13. Je zde evidováno 74 ulic a 787 adres. Žijí zde asi čtyři a půl tisíce obyvatel. V roce 1919 byly Řeporyje povýšeny na městys. Na severní straně zástavba Řeporyj plynule přechází do katastru Stodůlek, čemuž bylo přizpůsobeno samosprávné členění Prahy, nikoliv však hranice katastrů.',
    funFact: 'Nacházejí se na jihozápadním okraji Prahy, na počátku Dalejského údolí, které se odtud rozkládá podél Dalejského potoka.',
    sourceUrl: 'https://cs.wikipedia.org/wiki/%C5%98eporyje',
  },
  D089: {
    history: 'Třebonice (německy Trebonitz) jsou městská čtvrť a katastrální území hlavního města Prahy v nejzápadnější části obvodu Praha 5. Ves Třebonice je doložená od 13. století, k Praze byla připojena v roce 1974. Do katastrálního území Třebonic patří i významné obchodní, průmyslové a dopravní centrum kolem stanice metra Zličín.',
    funFact: 'Do katastrálního území Třebonic patří i významné obchodní, průmyslové a dopravní centrum kolem stanice metra Zličín.',
    sourceUrl: 'https://cs.wikipedia.org/wiki/T%C5%99ebonice',
  },
  D090: {
    history: 'Stodůlky (německy Stodulek) jsou městská čtvrť a katastrální území na západě Prahy, zahrnující historickou obec Stodůlky a množství nových čtvrtí, sídlištních i vilových. Jejich území je přibližně shodné s územím městské části Praha 13, sídlištní části Stodůlek tvoří Jihozápadní Město. Rozloha Stodůlek je 963,01 ha. Menší část území na jihozápadě katastrálního území Stodůlky (vymezená ulicí Jeremiášova, Radouňova a zhruba údolím Dalejského potoka) náleží k městské části Praha-Řeporyje. Do této řeporyjské části Stodůlek patří nejen nejsevernější část souvislé zástavby Řeporyj, ale i skanzen středověké vesnice Řepora (nazývaný též Tuležim) a obchodní centrum jižně od Jeremiášovy ulice (Makro, Mountfield, Billa). Zástavba starých Stodůlek s cennými příklady lidové architektury je od roku 1995 chráněna jako vesnická památková rezervace.',
    funFact: 'Jejich území je přibližně shodné s územím městské části Praha 13, sídlištní části Stodůlek tvoří Jihozápadní Město.',
    sourceUrl: 'https://cs.wikipedia.org/wiki/Stod%C5%AFlky',
  },
  D091: {
    history: 'Sobín (německy Sobin) je vesnice, bývalá obec, dnes městská čtvrť a katastrální území Prahy, na západě městské části Praha-Zličín, v jejímž rámci je začleněno do správního obvodu Praha 17. Nachází se v západním výběžku území Prahy. Na území Sobína, asi 1,2 km jižně od jeho zástavby, v místě, kde nevýrazný hřeben překračuje hranici Prahy a Chrášťan, se nachází kóta Teleček, nejvýše položený bod města Prahy (399 m n. m.).',
    funFact: 'Na území Sobína, asi 1,2 km jižně od jeho zástavby, v místě, kde nevýrazný hřeben překračuje hranici Prahy a Chrášťan, se nachází kóta Teleček, nejvýše položený bod města Prahy (399 m n.',
    sourceUrl: 'https://cs.wikipedia.org/wiki/Sob%C3%ADn',
  },
  D092: {
    history: 'Zličín (německy Slitschin) je městská čtvrť a katastrální území na západě Prahy, na severozápadním okraji městského obvodu Praha 5, o rozloze 317,61 ha. Tvoří severovýchodní část městské části Praha-Zličín.',
    funFact: 'Tvoří severovýchodní část městské části Praha-Zličín.',
    sourceUrl: 'https://cs.wikipedia.org/wiki/Zli%C4%8D%C3%ADn',
  },
  D093: {
    history: 'Řepy (německy Rüben) jsou městská čtvrť a katastrální území Prahy, které jako jediné tvoří území městské části Praha 17 v městském obvodě Praha 6. Nacházejí se na západě města, severně od vjezdu dálnice D5 do Prahy. Vesnice Řepy vznikla kolem 13. století, k Praze byla připojena roku 1968; od poloviny 80. let zde stojí sídliště. Do 31. prosince 2001 se městská část Praha 17 nazývala Praha-Řepy, přičemž do 17. listopadu 1994 městská část nezahrnovala jižní, sídlištní část katastrálního území Řepy. Vykonává působnost pověřeného úřadu i pro městskou část Praha-Zličín.',
    funFact: 'Nacházejí se na západě města, severně od vjezdu dálnice D5 do Prahy.',
    sourceUrl: 'https://cs.wikipedia.org/wiki/%C5%98epy',
  },
  D094: {
    history: 'Motol (dříve někdy také Motoly (pomnožné), německy Motol) je městská čtvrť a katastrální území v Praze, nacházející se v údolí Motolského potoka na západě města. Administrativně patří do městské části Praha 5.',
    funFact: 'Administrativně patří do městské části Praha 5.',
    sourceUrl: 'https://cs.wikipedia.org/wiki/Motol',
  },
  D095: {
    history: 'Radlice (německy Radlitz) jsou městská čtvrť a katastrální území Prahy, patřící k obvodu i městské části Praha 5. Název Radlice je odvozen z osobního jména Radla a znamenalo ves lidí Radlových.',
    funFact: 'Název Radlice je odvozen z osobního jména Radla a znamenalo ves lidí Radlových.',
    sourceUrl: 'https://cs.wikipedia.org/wiki/Radlice',
  },
  D096: {
    history: 'Jinonice jsou městská čtvrť a katastrální území v Praze, nacházejí se v kopcovitém terénu na jihozápad od centra na levém břehu Vltavy. Sousedí s Košířemi, Motolem, Radlicemi, Hlubočepy, Holyní a Stodůlkami. Celé Jinonice spadají do městského obvodu Praha 5, z toho většina katastrálního území patří k městské části Praha 5 a malá část území na západě (Nová Ves včetně retenční nádrže Asuán na Prokopském potoku) pak k městské části Praha 13, kam byla převedena pravděpodobně při správní reformě od 1. července 2001. Součástí Jinonic je také historická osada Butovice.',
    funFact: 'Sousedí s Košířemi, Motolem, Radlicemi, Hlubočepy, Holyní a Stodůlkami.',
    sourceUrl: 'https://cs.wikipedia.org/wiki/Jinonice',
  },
  D097: {
    history: 'Dejvice (německy Dejwitz, v letech 1939–45 Dewitz) jsou městská čtvrť a katastrální území v pražské městské části Praha 6, rozkládající se severně od Pražského hradu.',
    funFact: 'Dejvice (německy Dejwitz, v letech 1939–45 Dewitz) jsou městská čtvrť a katastrální území v pražské městské části Praha 6, rozkládající se severně od Pražského hradu.',
    sourceUrl: 'https://cs.wikipedia.org/wiki/Dejvice',
  },
  D098: {
    history: 'Břevnov (německy Breunau) je městská čtvrť a katastrální území Prahy, náležející téměř celé k městské části Praha 6, ale nepatrnou částí (krátkým úsekem ulice Spiritka) zasahující i do městské části Praha 5. Břevnov sousedí s následujícími pražskými katastrálními územími: Na severozápadě s Libocí, na severu s Veleslavínem, na severovýchodě se Střešovicemi, na východě s Hradčany, na jihu se Smíchovem a Motolem a na západě s Řepy a Ruzyní. Břevnov je tvořen 15 základními sídelními jednotkami: Svatá Markéta, Velký Břevnov, Nový Břevnov, Strahov, U Ladronky, U Císařky, Kajetánka, Vypich, Pod Nemocnicí, Střešovická nemocnice, Na Bateriích, Na Větrníku, Petřiny II, Petřiny III a Malý Břevnov. Na území Břevnova pramení potok Brusnice. Část Břevnova je právě tímto potokem zformována a Brusnici vděčí Břevnov za svůj poměrně členitý reliéf. Nejnižší nadmořská výška Břevnova je v místě, kde Brusnice opouští území Břevnova. Naopak nejvyšším místem Břevnova je Malý Břevnov s nadmořskou výškou přibližně 383 m. Obyvatelstvo je ze 47,2 % tvořeno muži, ženy tvoří 52,8 %, 89,5 % obyvatel je starší 15 let.',
    funFact: 'Břevnov sousedí s následujícími pražskými katastrálními územími: Na severozápadě s Libocí, na severu s Veleslavínem, na severovýchodě se Střešovicemi, na východě s Hradčany, na jihu se Smíchovem a Motolem a na západě s Řepy a Ruzyní.',
    sourceUrl: 'https://cs.wikipedia.org/wiki/B%C5%99evnov',
  },
  D099: {
    history: 'Košíře (německy Koschiř, popř. Koschirz; v letech 1939–1945 Körbern) jsou městská čtvrť a katastrální území v Praze. Nacházejí se v údolí (dnes zatrubněného) Motolského potoka na jeho pravém břehu. Na severu a na východě sousedí se Smíchovem, na západě s Motolem, na jihu s Jinonicemi a Radlicemi; jsou součástí městské části Praha 5.',
    funFact: 'Koschirz; v letech 1939–1945 Körbern) jsou městská čtvrť a katastrální území v Praze.',
    sourceUrl: 'https://cs.wikipedia.org/wiki/Ko%C5%A1%C3%AD%C5%99e',
  },
  D100: {
    history: 'Liboc (německy Libotz) je městská čtvrť a katastrální území Prahy nedaleko od krajinné oblasti Divoká Šárka a obory Hvězda. Do jejího katastru patří stará část Dolní i Horní Liboce (Dolní Liboc byla samostatná obec, zatímco Horní Liboc – domy v Libocké ulici počínaje čp. 251 – patřila k Břevnovu), dále obora Hvězda, bývalé polní tratě V zahradách a U křížku a západní část Divoké Šárky. Liboc je součástí městské části Praha 6. Z Liboce je dobré dopravní spojení do centra města: Trolejbusem 59 a tramvajemi 20 a 26 z Divoké Šárky na zastávku metra A i vlakovou stanici Nádraží Veleslavín, tramvají 20 na Malou Stranu a Anděl (kde je přestup na metro B), tramvají 26 na Strossmayerovo náměstí (kde je přestup na metro C) a Hlavní nádraží a v neposlední řadě autobusem 191 na Petřiny (přestup na metro A), Vypich a Stadion Strahov. Do budoucna se plánuje vybudování vlakové zastávky v Liboci, která by měla být na trati Praha-Kladno, jenž Libocem již prochází.',
    funFact: 'Do jejího katastru patří stará část Dolní i Horní Liboce (Dolní Liboc byla samostatná obec, zatímco Horní Liboc – domy v Libocké ulici počínaje čp.',
    sourceUrl: 'https://cs.wikipedia.org/wiki/Liboc',
  },
  D101: {
    history: 'Veleslavín (německy Weleslawin) je dříve samostatná vesnice, dnes městská čtvrť a katastrální území v městské části Praha 6, mezi ulicemi Evropskou, Kladenskou, Pod Petřinami a Na okraji. Veleslavín sousedí na severu s Vokovicemi, na východě se Střešovicemi, na jihu s Břevnovem a na západě s Libocí, kde jeho hraniční území tvoří Libocký rybník a upravená studánka s pitnou vodou Veleslavínka.',
    funFact: 'Veleslavín sousedí na severu s Vokovicemi, na východě se Střešovicemi, na jihu s Břevnovem a na západě s Libocí, kde jeho hraniční území tvoří Libocký rybník a upravená studánka s pitnou vodou Veleslavínka.',
    sourceUrl: 'https://cs.wikipedia.org/wiki/Veleslav%C3%ADn',
  },
  D102: {
    history: 'Vokovice (německy Wokowitz) jsou městská čtvrť a katastrální území hlavního města Prahy, součást městské části, obvodu a správního obvodu Praha 6 Vokovice byly připojeny k Praze roku 1922, kdy měly 2021 obyvatel. Předtím byly samostatnou obcí.',
    funFact: 'Předtím byly samostatnou obcí.',
    sourceUrl: 'https://cs.wikipedia.org/wiki/Vokovice',
  },
  D103: {
    history: 'Ruzyně (německy Rusin) je městská čtvrť a katastrální území hlavního města Prahy, součást městské části, obvodu a správního obvodu Praha 6. Před připojením k Praze roku 1960 byla samostatnou obcí. Rozlohou 15 km² je po Horních Počernicích druhou největší pražskou čtvrtí. Část zástavby staré Ruzyně s cennými příklady lidové architektury je od roku 1995 chráněna jako vesnická památková rezervace.',
    funFact: 'Před připojením k Praze roku 1960 byla samostatnou obcí.',
    sourceUrl: 'https://cs.wikipedia.org/wiki/Ruzyn%C4%9B',
  },
  D104: {
    history: 'Nebušice (německy Nebuschitz) jsou městská čtvrť a katastrální území, a od 24. listopadu 1990 pod názvem Praha-Nebušice také městská část na severozápadě hlavního města Prahy, o rozloze 368,07 ha. Je zde evidováno 59 ulic a 859 adres.',
    funFact: 'Je zde evidováno 59 ulic a 859 adres.',
    sourceUrl: 'https://cs.wikipedia.org/wiki/Nebu%C5%A1ice',
  },
  D105: {
    history: 'Přední Kopanina (německy Vorder Kopanin) je městská čtvrť a katastrální území a od 24. listopadu 1990 pod názvem Praha-Přední Kopanina také městská část hlavního města Prahy, nacházející se 10 km od centra při severozápadním okraji města. Větší část rozlohy zaujímají pole v blízkosti mezinárodního letiště Praha-Ruzyně, zástavba se soustřeďuje při jižní hraně údolí Kopaninského potoka. Je zde evidováno 10 ulic se 164 adresami a celkem 717 obyvatel.',
    funFact: 'Větší část rozlohy zaujímají pole v blízkosti mezinárodního letiště Praha-Ruzyně, zástavba se soustřeďuje při jižní hraně údolí Kopaninského potoka.',
    sourceUrl: 'https://cs.wikipedia.org/wiki/P%C5%99edn%C3%AD_Kopanina',
  },
  D106: {
    history: 'Benice (německy Benitz) jsou městská čtvrť a katastrální území na okraji Prahy, které vytváří městskou část Praha-Benice. Je zde evidováno 11 ulic a 192 adres. Žije zde zhruba 600 obyvatel. Na území Benic je v ulici K Lipanům nejmenší hřbitov v Praze. Na hřbitově jsou chráněné lípy.',
    funFact: 'Na území Benic je v ulici K Lipanům nejmenší hřbitov v Praze.',
    sourceUrl: 'https://cs.wikipedia.org/wiki/Benice_(Praha)',
  },
  D107: {
    history: 'Dubeč (německy Groß Dubetsch), původně v mužském rodu, dnes i v ženském, je městská čtvrť a katastrální území na jihovýchodě hlavního města Prahy tvořící území městské části Praha-Dubeč. Ves je doložena již v 11. století, v letech 1502–1974 byla Dubeč samostatným městečkem, jehož součástí je i místní část Dubeček. Praha-Dubeč je od 24. listopadu 1990 městská část, jejímž územím je katastrální území Dubeč. Městská část je součástí městského obvodu Praha 10. Přenesenou působnost státní správy zde vykonává městská část Praha 15 v rámci stejnojmenného správního obvodu.',
    funFact: 'Městská část je součástí městského obvodu Praha 10.',
    sourceUrl: 'https://cs.wikipedia.org/wiki/Dube%C4%8D',
  },
  D108: {
    history: 'Kolovraty (německy Kolowrat) jsou městská čtvrť a katastrální území Prahy v blízkosti Říčan u Prahy v jihovýchodním cípu hlavního města Prahy v obvodu Praha 10. Mají rozlohu 5,903 km2. Žije zde přes tři tisíce obyvatel. Je zde evidováno 50 ulic a 900 adres. Spolu s Lipany patří do městské části Praha-Kolovraty.',
    funFact: 'Spolu s Lipany patří do městské části Praha-Kolovraty.',
    sourceUrl: 'https://cs.wikipedia.org/wiki/Kolovraty',
  },
  D109: {
    history: 'Lipany (německy Lipan) jsou městská čtvrť a katastrální území o rozloze 58,23 hektaru, rozkládající se na okraji jihovýchodního cípu hlavního města Prahy, od 24. listopadu 1990 součást městské části Praha-Kolovraty v obvodě Praha 10.',
    funFact: 'Lipany (německy Lipan) jsou městská čtvrť a katastrální území o rozloze 58,23 hektaru, rozkládající se na okraji jihovýchodního cípu hlavního města Prahy, od 24.',
    sourceUrl: 'https://cs.wikipedia.org/wiki/Lipany_(Praha)',
  },
  D110: {
    history: 'Nedvězí u Říčan (německy Nedwies) je městská čtvrť a katastrální území Prahy v obvodě Praha 10 (do 30. června 2016 byla jako část obce označena názvem Nedvězí bez přívlastku), tvořící městskou část Praha-Nedvězí. Leží na jihovýchodním okraji Prahy, v sousedství města Říčany, a dosud si do značné míry zachovalo venkovský charakter.',
    funFact: 'Leží na jihovýchodním okraji Prahy, v sousedství města Říčany, a dosud si do značné míry zachovalo venkovský charakter.',
    sourceUrl: 'https://cs.wikipedia.org/wiki/Nedv%C4%9Bz%C3%AD_u_%C5%98%C3%AD%C4%8Dan',
  },
  D111: {
    history: 'Královice (německy Kralowitz) jsou městská čtvrť a katastrální území Prahy, tvořící území městské části Praha-Královice. Je zde evidováno 12 ulic a 121 adres. Žije zde zhruba 300 obyvatel. Do dnešní doby si Královice zachovaly původní vesnický ráz, díky svým urbanistickým hodnotám se v roce 1991 staly vesnickou památkovou zónou. Mnoho z těchto hodnot je však nyní ohroženo developerskými aktivitami společností Karla Komárka,[zdroj?] které se staly vlastníky cca 110 ha okolních pozemků. V územní plánu jsou navržené změny využití části pozemků v Královicích.',
    funFact: 'Do dnešní doby si Královice zachovaly původní vesnický ráz, díky svým urbanistickým hodnotám se v roce 1991 staly vesnickou památkovou zónou.',
    sourceUrl: 'https://cs.wikipedia.org/wiki/Kr%C3%A1lovice_(Praha)',
  },
  D112: {
    history: 'Kamýk (německy Kameik) je městská čtvrť a katastrální území v Praze, které bylo vytvořeno v roce 1988 rozhodnutím (účinnost od 1989) Národního výboru hl. města Prahy na úkor dosavadních katastrálních území Modřany, Lhotka a Libuš v rámci městského obvodu Praha 4. Dnes je k. ú. Kamýk součástí území městské části Praha 12. Název je odvozen z názvu kopce[zdroj?] a lesa, u něhož se čtvrť nachází.',
    funFact: 'Název je odvozen z názvu kopce[zdroj?] a lesa, u něhož se čtvrť nachází.',
    sourceUrl: 'https://cs.wikipedia.org/wiki/Kam%C3%BDk_(Praha)',
  },
};

export function getDistrictStory(code: string) {
  return DISTRICT_STORIES[code.toUpperCase()];
}
