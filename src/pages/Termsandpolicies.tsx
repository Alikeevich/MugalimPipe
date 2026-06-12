import React from 'react';

const Termsandpolicies: React.FC = () => {
  return (
    <div className="max-w-3xl mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold mb-6">Правовые документы и политики</h1>
      <p className="mb-6">
        Наш сервис регулируется следующими документами. Нажмите на любую ссылку, чтобы
        прочитать полный текст.
      </p>
      <ul className="list-disc list-inside space-y-2 mb-8">
        <li>
          <a href="/terms-of-service" className="text-blue-600 underline" onClick={(e) => { e.preventDefault(); window.history.pushState({}, '', '/terms-of-service'); window.dispatchEvent(new PopStateEvent('popstate')); }}>
            Условия использования
          </a>
        </li>
        <li>
          <a href="/privacy-policy" className="text-blue-600 underline" onClick={(e) => { e.preventDefault(); window.history.pushState({}, '', '/privacy-policy'); window.dispatchEvent(new PopStateEvent('popstate')); }}>
            Политика конфиденциальности
          </a>
        </li>
        <li>
          <a href="/refund-policy" className="text-blue-600 underline" onClick={(e) => { e.preventDefault(); window.history.pushState({}, '', '/refund-policy'); window.dispatchEvent(new PopStateEvent('popstate')); }}>
            Политика возвратов
          </a>
        </li>
      </ul>
      <p className="text-sm text-gray-600">
        All of the above policies are included on this site. If you need full text in one page,
        navigate to each document directly using the links above.
      </p>
    </div>
  );
};

export default Termsandpolicies;
