export const SUMATERA_CITIES: { province: string; cities: string[] }[] = [
  {
    province: "Aceh",
    cities: [
      "Banda Aceh", "Sabang", "Lhokseumawe", "Langsa", "Subulussalam",
      "Meulaboh", "Bireuen", "Sigli", "Takengon", "Blangpidie",
      "Calang", "Tapak Tuan", "Singkil", "Kutacane", "Lhoknga",
    ],
  },
  {
    province: "Sumatera Utara",
    cities: [
      "Medan", "Pematangsiantar", "Binjai", "Tebing Tinggi", "Kisaran",
      "Rantauprapat", "Padangsidempuan", "Sibolga", "Gunungsitoli", "Balige",
      "Lubuk Pakam", "Tanjung Balai", "Dolok Sanggul", "Sidikalang",
    ],
  },
  {
    province: "Sumatera Barat",
    cities: [
      "Padang", "Bukittinggi", "Payakumbuh", "Solok", "Padangpanjang",
      "Sawahlunto", "Sijunjung", "Dharmasraya", "Lubuk Basung",
    ],
  },
  {
    province: "Riau",
    cities: [
      "Pekanbaru", "Dumai", "Bangkinang", "Rengat", "Pasir Pengaraian",
      "Tembilahan", "Bagansiapiapi",
    ],
  },
  {
    province: "Kepulauan Riau",
    cities: ["Batam", "Tanjungpinang", "Tanjung Uban"],
  },
  {
    province: "Jambi",
    cities: ["Jambi", "Bungo", "Muaro Bungo", "Sungai Penuh", "Kuala Tungkal"],
  },
  {
    province: "Sumatera Selatan",
    cities: [
      "Palembang", "Prabumulih", "Baturaja", "Lubuklinggau", "Lahat",
      "Sekayu", "Muara Enim", "Indralaya",
    ],
  },
  {
    province: "Bengkulu",
    cities: ["Bengkulu", "Curup", "Manna", "Arga Makmur"],
  },
  {
    province: "Lampung",
    cities: [
      "Bandar Lampung", "Metro", "Kotabumi", "Liwa", "Kalianda",
      "Pringsewu", "Blambangan Umpu",
    ],
  },
  {
    province: "Bangka Belitung",
    cities: ["Pangkalpinang", "Sungailiat", "Tanjungpandan", "Manggar"],
  },
];

export const ALL_CITIES: string[] = SUMATERA_CITIES.flatMap((p) => p.cities).sort();
