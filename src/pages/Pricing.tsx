import React from 'react';

const Pricing: React.FC = () => {
  return (
    <div className="max-w-3xl mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold mb-6">Тарифы</h1>
      <p className="mb-6">
        Выберите план, который подходит вам. Все цены указаны в долларах США и взимаются ежемесячно.
      </p>
      <div className="grid md:grid-cols-2 gap-8">
        <div className="p-6 border rounded-lg shadow-sm">
          <h2 className="text-2xl font-semibold mb-2">Бесплатный</h2>
          <p className="text-lg mb-4">Базовый доступ с ограниченными возможностями.</p>
          <ul className="list-disc list-inside mb-4">
            <li>До 10 анализов в месяц</li>
            <li>Стандартная поддержка</li>
          </ul>
        </div>

        <div className="p-6 border rounded-lg shadow-sm">
          <h2 className="text-2xl font-semibold mb-2">Про</h2>
          <p className="text-lg mb-4">Неограниченное количество анализов и приоритетная поддержка.</p>
          <ul className="list-disc list-inside mb-4">
            <li>Неограниченные загрузки</li>
            <li>Приоритетная поддержка по электронной почте</li>
          </ul>
          <p className="text-2xl font-bold">19.99 $ / месяц</p>
        </div>
      </div>

      <p className="mt-10 text-sm text-gray-600">
        Подписываясь, вы соглашаетесь с нашими{' '}
        <a
          href="/terms-of-service"
          className="text-blue-600 underline"
          onClick={(e) => {
            e.preventDefault();
            window.history.pushState({}, '', '/terms-of-service');
            window.dispatchEvent(new PopStateEvent('popstate'));
          }}
        >
          Условиями использования
        </a>
        {', '}
        <a
          href="/privacy-policy"
          className="text-blue-600 underline"
          onClick={(e) => {
            e.preventDefault();
            window.history.pushState({}, '', '/privacy-policy');
            window.dispatchEvent(new PopStateEvent('popstate'));
          }}
        >
          Политикой конфиденциальности
        </a>
        {', и '}
        <a
          href="/refund-policy"
          className="text-blue-600 underline"
          onClick={(e) => {
            e.preventDefault();
            window.history.pushState({}, '', '/refund-policy');
            window.dispatchEvent(new PopStateEvent('popstate'));
          }}
        >
          Политикой возвратов
        </a>.
      </p>
    </div>
  );
};

export default Pricing;
