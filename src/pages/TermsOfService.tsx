import React from 'react';

const TermsOfService: React.FC = () => {
  return (
    <div className="max-w-3xl mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold mb-6">Условия использования</h1>
      <p className="mb-4">
        Добро пожаловать на MugalimPipe. Получая доступ к нашему сервису или используя его, вы
        соглашаетесь с настоящими Условиями использования. Пожалуйста, ознакомьтесь с ними
        внимательно.
      </p>
      <h2 className="text-2xl font-semibold mt-8 mb-4">1. Использование сервиса</h2>
      <p className="mb-4">
        Вы можете использовать сервис только в законных целях и в соответствии с этими
        Условиями. Вы соглашаетесь не злоупотреблять сервисом и не помогать другим делать это.
      </p>
      <h2 className="text-2xl font-semibold mt-8 mb-4">2. Ответственность за аккаунт</h2>
      <p className="mb-4">
        Если вы создаёте аккаунт, вы отвечаете за сохранность своих учетных данных и за все
        действия, выполняемые под вашим аккаунтом.
      </p>
      <h2 className="text-2xl font-semibold mt-8 mb-4">3. Оплата и цены</h2>
      <p className="mb-4">
        Информация о ценах размещена на странице <a href="/pricing" className="text-blue-600 underline" onClick={(e) => { e.preventDefault(); window.history.pushState({}, '', '/pricing'); window.dispatchEvent(new PopStateEvent('popstate')); }}>Тарифы</a>.
        Платежи обрабатываются нашими сторонними поставщиками, и вы также соглашаетесь с их
        условиями.
      </p>
      <h2 className="text-2xl font-semibold mt-8 mb-4">4. Прекращение</h2>
      <p className="mb-4">
        Мы можем прекратить или приостановить ваш доступ к сервису в любое время, с
        предварительным уведомлением или без него.
      </p>
      <p className="mt-8 text-sm text-gray-500">
        Last updated: February 18, 2026
      </p>
    </div>
  );
};

export default TermsOfService;
