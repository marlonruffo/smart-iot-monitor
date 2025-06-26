import React, { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  FaMicrochip,
  FaCloudUploadAlt,
  FaChartLine,
  FaCheckCircle,
  FaDatabase,
  FaWifi,
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const chartData = Array.from({ length: 12 }, (_, i) => ({
  name: `${i + 10}:00`,
  value: Math.floor(Math.random() * 25 + 10),
}));

export default function LandingPage() {
  const navigate = useNavigate();
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const root = window.document.documentElement;
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [isDark]);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 transition-colors duration-500">
      <div className="flex justify-end p-4 max-w-6xl mx-auto">
        <button
          onClick={() => setIsDark(!isDark)}
          className="bg-gray-200 dark:bg-gray-700 px-4 py-2 rounded-md shadow-sm focus:outline-none"
          aria-label="Toggle Dark Mode"
        >
          {isDark ? '🌙 Modo Escuro' : '☀️ Modo Claro'}
        </button>
      </div>

      <section className="py-20 text-center px-4">
        <h1 className="text-5xl font-extrabold">Monitor IoT</h1>
        <p className="mt-4 text-lg max-w-2xl mx-auto">
          Monitore, envie e visualize dados dos seus sensores em tempo real com simplicidade e performance.
        </p>
      </section>

      <section className="mt-16 px-6 max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-10">Funcionalidades</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <FeatureCard
            icon={<FaMicrochip size={40} />}
            title="Cadastrar Sensores"
            description="Adicione sensores físicos ou virtuais e mantenha seu sistema organizado."
            onClick={() => navigate('/sensors')}
          />
          <FeatureCard
            icon={<FaCloudUploadAlt size={40} />}
            title="Enviar Leituras"
            description="Transmita dados de temperatura, umidade, entre outros, diretamente para a nuvem."
            onClick={() => navigate('/submit-reading')}
          />
          <FeatureCard
            icon={<FaChartLine size={40} />}
            title="Visualizar Dados"
            description="Veja gráficos, tendências e anomalias nos dados recebidos dos sensores."
            onClick={() => navigate('/view-readings')}
          />
        </div>
      </section>


      <section className="mt-20 px-6 max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-10">Como funciona?</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
          <Step icon={<FaMicrochip />} title="1. Cadastre" description="Adicione sensores no sistema com ID único." />
          <Step icon={<FaCloudUploadAlt />} title="2. Envie" description="As leituras são enviadas por APIs ou formulários." />
          <Step icon={<FaChartLine />} title="3. Visualize" description="Painéis gráficos mostram os dados ao vivo." />
        </div>
      </section>

      <section className="mt-20 px-6 max-w-4xl mx-auto">
        <h2 className="text-2xl font-semibold text-center mb-4">
          Gráficos de Leitura de Sensores
        </h2>
        <div className="w-full h-64 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 transition-colors duration-500">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#444' : '#ccc'} />
              <XAxis dataKey="name" stroke={isDark ? '#ddd' : '#333'} />
              <YAxis stroke={isDark ? '#ddd' : '#333'} />
              <Tooltip contentStyle={{ backgroundColor: isDark ? '#222' : '#fff', color: isDark ? '#eee' : '#333' }} />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#6366f1"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}

function FeatureCard({ icon, title, description, onClick }) {
  return (
    <div
      onClick={onClick}
      className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md hover:shadow-2xl hover:scale-105 cursor-pointer transition-all duration-300 flex flex-col items-center"
    >
      <div className="text-indigo-600 mb-4">{icon}</div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-gray-500 dark:text-gray-400 text-sm">{description}</p>
    </div>
  );
}

function StatItem({ icon, value, label }) {
  return (
    <div className="flex flex-col items-center">
      <div className="text-indigo-600 mb-2">{icon}</div>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-gray-600 dark:text-gray-400 mt-1">{label}</div>
    </div>
  );
}

function Step({ icon, title, description }) {
  return (
    <div className="flex flex-col items-center">
      <div className="text-indigo-600 mb-3">{icon}</div>
      <h4 className="font-bold text-lg">{title}</h4>
      <p className="text-gray-500 dark:text-gray-400 mt-2">{description}</p>
    </div>
  );
}