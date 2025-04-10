// app/privacy-policy/page.tsx (para app router)
// ou
// pages/privacy-policy.tsx (para pages router)

import Link from "next/link";

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-linear-to-b from-gray-900 to-black py-10 px-4">
      <div className="max-w-3xl mx-auto bg-white p-8 rounded-2xl shadow-xl">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Política de Privacidade</h1>

        <p className="text-gray-700 mb-4">
          Última atualização: <strong>09 de abril de 2025</strong>
        </p>

        <p className="text-gray-700 mb-6">
          Na <strong>B.U.B.A - Barbearia Quase Premium</strong>, valorizamos sua privacidade. Esta política descreve como coletamos, usamos e protegemos suas informações pessoais ao utilizar nosso site de agendamentos.
        </p>

        <h2 className="text-xl font-semibold text-gray-800 mt-6 mb-2">1. Informações Coletadas</h2>
        <ul className="list-disc list-inside text-gray-700 mb-6">
          <li>Nome completo</li>
          <li>Endereço de e-mail</li>
          <li>Foto de perfil (via login do Google)</li>
          <li>Informações de agendamento (data, hora, serviço)</li>
          <li>Endereço IP e dados de navegação</li>
        </ul>

        <h2 className="text-xl font-semibold text-gray-800 mt-6 mb-2">2. Uso das Informações</h2>
        <p className="text-gray-700 mb-6">
          Utilizamos os dados para realizar agendamentos, identificar usuários, melhorar a experiência no site e enviar informações relevantes sobre seus serviços.
        </p>

        <h2 className="text-xl font-semibold text-gray-800 mt-6 mb-2">3. Compartilhamento de Dados</h2>
        <p className="text-gray-700 mb-6">
          Não compartilhamos seus dados com terceiros, exceto quando necessário por obrigações legais ou serviços de terceiros como o Google.
        </p>

        <h2 className="text-xl font-semibold text-gray-800 mt-6 mb-2">4. Cookies</h2>
        <p className="text-gray-700 mb-6">
          Podemos usar cookies para melhorar o funcionamento do site. Você pode desativá-los nas configurações do seu navegador, embora isso possa afetar sua experiência.
        </p>

        <h2 className="text-xl font-semibold text-gray-800 mt-6 mb-2">5. Segurança</h2>
        <p className="text-gray-700 mb-6">
          Usamos conexões seguras (HTTPS) e autenticação via Google para garantir sua segurança. Nenhum sistema é infalível, mas faremos o possível para protegê-lo.
        </p>

        <h2 className="text-xl font-semibold text-gray-800 mt-6 mb-2">6. Seus Direitos</h2>
        <ul className="list-disc list-inside text-gray-700 mb-6">
          <li>Acessar e corrigir seus dados</li>
          <li>Solicitar exclusão de informações</li>
          <li>Revogar consentimento</li>
        </ul>
        <p className="text-gray-700 mb-6">
          Para exercer esses direitos, entre em contato via WhatsApp:{" "}
          <a href="https://wa.me/5541996235364" className="text-blue-600 underline" target="_blank" rel="noopener noreferrer">
            (41) 99623-5364
          </a>
        </p>

        <h2 className="text-xl font-semibold text-gray-800 mt-6 mb-2">7. Consentimento</h2>
        <p className="text-gray-700 mb-6">
          Ao utilizar nosso site, você concorda com esta Política de Privacidade e nossos Termos de Uso.
        </p>

        <h2 className="text-xl font-semibold text-gray-800 mt-6 mb-2">8. Alterações</h2>
        <p className="text-gray-700 mb-6">
          Podemos atualizar esta política periodicamente. A versão mais recente estará sempre disponível nesta página.
        </p>

        <h2 className="text-xl font-semibold text-gray-800 mt-6 mb-2">9. Contato</h2>
        <p className="text-gray-700 mb-6">
          Dúvidas? Fale com a gente:
          <br />
          📞 WhatsApp:{" "}
          <a href="https://wa.me/5541996235364" className="text-blue-600 underline" target="_blank" rel="noopener noreferrer">
            (41) 99623-5364
          </a>
          <br />
          📧 E-mail: em breve
        </p>

        <div className="mt-8 text-center">
          <Link href="/" className="text-blue-800 hover:underline">
            ← Voltar para o início
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
