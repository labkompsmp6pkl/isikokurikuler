import React from 'react';

const Beranda: React.FC = () => {
  const habits = [
    {
      icon: "☀️",
      title: "Bangun Pagi",
      desc: "Mulai harimu lebih awal biar otak segar dan nggak buru-buru berangkat sekolah! Disiplin pagi itu ciri calon pemimpin.",
      color: "bg-orange-100 border-orange-300 text-orange-800"
    },
    {
      icon: "🙏",
      title: "Beribadah",
      desc: "Jangan lupa bersyukur dan tenang sejenak. Ibadah bikin hatimu tulus, fokus, dan punya pegangan hidup yang kuat.",
      color: "bg-emerald-100 border-emerald-300 text-emerald-800"
    },
    {
      icon: "🏃",
      title: "Berolahraga",
      desc: "Tubuh butuh gerak! Olahraga bikin kamu makin semangat, nggak gampang capek, dan otak makin lancar mikirnya.",
      color: "bg-blue-100 border-blue-300 text-blue-800"
    },
    {
      icon: "🥗",
      title: "Makan Sehat",
      desc: "Isi energimu dengan nutrisi keren. Badan sehat, kulit bagus, dan daya ingat tajam karena kamu pilih makanan bergizi.",
      color: "bg-green-100 border-green-300 text-green-800"
    },
    {
      icon: "📚",
      title: "Gemar Belajar",
      desc: "Dunia itu luas, ayo cari tahu hal baru! Belajar asyik itu bukan cuma soal nilai, tapi soal cara kamu menaklukkan masa depan.",
      color: "bg-purple-100 border-purple-300 text-purple-800"
    },
    {
      icon: "🌍",
      title: "Bermasyarakat",
      desc: "Jadi pahlawan di sekitar kita! Membantu orang lain dan peduli lingkungan bikin kamu jadi pribadi yang dicintai semua orang.",
      color: "bg-teal-100 border-teal-300 text-teal-800"
    },
    {
      icon: "🌙",
      title: "Tidur Cepat",
      desc: "Matikan gadget, saatnya recharge! Tidur cukup bikin kamu bangun besok dengan perasaan ceria dan mata yang fresh.",
      color: "bg-indigo-100 border-indigo-300 text-indigo-800"
    }
  ];

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      {/* Hero Section */}
      <div className="bg-white rounded-3xl p-8 shadow-xl text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-800 mb-2">
          Misi Generasi Hebat
        </h1>
        <p className="text-gray-500 text-lg">7 Kebiasaan Indonesia Hebat untuk masa depan cerah</p>
      </div>

      {/* Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {habits.map((habit, index) => (
          <div 
            key={index} 
            className={`group relative p-6 rounded-2xl border-2 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 ${habit.color}`}
          >
            <div className="flex flex-col items-center text-center">
              <div className="text-6xl mb-4 drop-shadow-md transform group-hover:scale-110 transition-transform">
                {habit.icon}
              </div>
              <h3 className="text-xl font-bold mb-3 uppercase tracking-wider">
                {habit.title}
              </h3>
              <div className="bg-white/60 rounded-xl p-4 w-full backdrop-blur-sm">
                <span className="text-xs font-bold uppercase text-gray-400 block mb-1">🚀 Misi Kamu</span>
                <p className="text-sm font-medium leading-relaxed">
                  {habit.desc}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Beranda;