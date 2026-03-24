import React, { useState, useEffect } from 'react';
import { Settings, Home, BarChart3, Gift, User, ChevronRight, Plus, Play, RotateCcw, LogOut, Clock, CheckCircle, XCircle, TrendingUp } from 'lucide-react';

// Mock Data
const mockChildren = [
  { id: 1, name: 'Артём', age: 12, coinsToday: 42, accuracy: 87, contracts: 2 },
  { id: 2, name: 'Маша', age: 10, coinsToday: 35, accuracy: 92, contracts: 1 },
];

const mockContracts = [
  {
    id: 1,
    childId: 1,
    subject: 'Математика',
    grade: '7 клас',
    progress: 67,
    prize: 'PlayStation 5 🎮',
    status: 'active',
    pointsPerCorrect: 5,
    penalty: 2,
  },
  {
    id: 2,
    childId: 1,
    subject: 'Английский',
    grade: '6 клас',
    progress: 42,
    prize: 'AirPods 🎧',
    status: 'active',
    pointsPerCorrect: 3,
    penalty: 1,
  },
];

const mockQuestions = [
  { id: 1, text: 'Сколько будет 15 × 7?', subject: 'Математика', answers: ['105', '110', '95', '115'], correct: 0 },
  { id: 2, text: 'Что такое синоним?', subject: 'Английский', answers: ['Слово с противоположным значением', 'Слово с похожим значением', 'Слово из другого языка', 'Слово множественного числа'], correct: 1 },
  { id: 3, text: 'Сколько будет 234 ÷ 6?', subject: 'Математика', answers: ['37', '39', '41', '43'], correct: 1 },
  { id: 4, text: 'Как пишется слово "colour" в американском английском?', subject: 'Английский', answers: ['colour', 'color', 'colur', 'coler'], correct: 1 },
  { id: 5, text: 'Что будет результатом 12² - 8²?', subject: 'Математика', answers: ['80', '144', '64', '208'], correct: 0 },
  { id: 6, text: 'Какой герой написал "To be or not to be"?', subject: 'Английский', answers: ['Ромео', 'Гамлет', 'Отелло', 'Макбет'], correct: 1 },
];

const BrainCoinApp = () => {
  // Navigation state
  const [currentScreen, setCurrentScreen] = useState('splash');
  const [userRole, setUserRole] = useState(null); // 'parent' or 'child'
  const [selectedChildId, setSelectedChildId] = useState(1);

  // Parent dashboard state
  const [parentTab, setParentTab] = useState('dashboard');

  // Contract creator state
  const [contractForm, setContractForm] = useState({
    childId: 1,
    subject: 'Математика',
    grade: '5 клас',
    timePerQuestion: 30,
    pointsPerCorrect: 5,
    penalty: 2,
    prizeName: '',
    prizeCoins: 100,
  });

  // Child dashboard state
  const [childTab, setChildTab] = useState('home');
  const [childCoins, setChildCoins] = useState(247);

  // Quiz state
  const [quizState, setQuizState] = useState({
    currentQuestion: 0,
    questions: mockQuestions.slice(0, 10),
    answers: [],
    score: 0,
    timeRemaining: 30,
    isAnswered: false,
    selectedAnswer: null,
    isCorrect: null,
  });

  // Results state
  const [quizResults, setQuizResults] = useState(null);

  // Timer effect
  useEffect(() => {
    if (currentScreen !== 'quiz' || quizState.isAnswered) return;

    const timer = setInterval(() => {
      setQuizState(prev => {
        if (prev.timeRemaining <= 1) {
          handleAnswerSubmit(-1); // Auto-submit on timeout
          return prev;
        }
        return { ...prev, timeRemaining: prev.timeRemaining - 1 };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [currentScreen, quizState.isAnswered]);

  const handleSelectRole = (role) => {
    setUserRole(role);
    if (role === 'parent') {
      setCurrentScreen('parentDashboard');
      setParentTab('dashboard');
    } else {
      setCurrentScreen('childHome');
      setChildTab('home');
    }
  };

  const handleStartQuiz = (contractId) => {
    setQuizState({
      currentQuestion: 0,
      questions: mockQuestions.slice(0, 10),
      answers: [],
      score: 0,
      timeRemaining: 30,
      isAnswered: false,
      selectedAnswer: null,
      isCorrect: null,
    });
    setCurrentScreen('quiz');
  };

  const handleAnswerSubmit = (answerIndex) => {
    const question = quizState.questions[quizState.currentQuestion];
    const isCorrect = answerIndex === question.correct;

    setQuizState(prev => ({
      ...prev,
      isAnswered: true,
      selectedAnswer: answerIndex,
      isCorrect,
      score: isCorrect ? prev.score + 5 : prev.score,
    }));
  };

  const handleNextQuestion = () => {
    if (quizState.currentQuestion < quizState.questions.length - 1) {
      setQuizState(prev => ({
        ...prev,
        currentQuestion: prev.currentQuestion + 1,
        timeRemaining: 30,
        isAnswered: false,
        selectedAnswer: null,
        isCorrect: null,
      }));
    } else {
      // Quiz complete
      setQuizResults({
        score: quizState.score,
        correct: quizState.answers.filter((a, i) => mockQuestions[i].correct === a).length,
        total: quizState.questions.length,
        timestamp: new Date(),
      });
      setCurrentScreen('results');
    }
  };

  const handleStartNewQuiz = () => {
    setCurrentScreen('childHome');
    setChildTab('home');
  };

  // SPLASH SCREEN
  if (currentScreen === 'splash') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-6 animate-bounce">🧠💰</div>
          <h1 className="text-5xl font-black text-blue-400 mb-2 tracking-tight">BrainCoin</h1>
          <p className="text-slate-300 mb-12 text-lg">Вучися і заробляй монети!</p>

          <div className="space-y-4">
            <button
              onClick={() => handleSelectRole('parent')}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-lg transition-all transform hover:scale-105 active:scale-95 shadow-lg text-lg"
            >
              👨‍👩‍👧 Я родитель
            </button>
            <button
              onClick={() => handleSelectRole('child')}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-6 rounded-lg transition-all transform hover:scale-105 active:scale-95 shadow-lg text-lg"
            >
              👦 Я ребёнок
            </button>
          </div>

          <p className="text-slate-500 mt-10 text-sm">версія 1.0 • 2026</p>
        </div>
      </div>
    );
  }

  // PARENT DASHBOARD
  if (currentScreen === 'parentDashboard' && userRole === 'parent') {
    return (
      <div className="min-h-screen bg-slate-50">
        {/* Header */}
        <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
          <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
            <h1 className="text-2xl font-bold text-slate-900">Панель родителя</h1>
            <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
              <Settings className="w-6 h-6 text-slate-600" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-2xl mx-auto px-4 py-6">
          {parentTab === 'dashboard' && (
            <div>
              <h2 className="text-lg font-bold text-slate-900 mb-4">Дети</h2>
              <div className="space-y-4 mb-6">
                {mockChildren.map(child => (
                  <div key={child.id} className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-bold text-slate-900">{child.name}</h3>
                        <p className="text-sm text-slate-500">{child.age} лет</p>
                      </div>
                      <span className="text-2xl font-bold text-orange-500">{child.coinsToday} 🪙</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="bg-slate-100 rounded p-2">
                        <p className="text-slate-600">Точність</p>
                        <p className="font-bold text-green-600">{child.accuracy}%</p>
                      </div>
                      <div className="bg-slate-100 rounded p-2">
                        <p className="text-slate-600">Контракти</p>
                        <p className="font-bold text-blue-600">{child.contracts}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={() => setCurrentScreen('contractCreator')}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-all transform hover:scale-105 active:scale-95"
              >
                <Plus className="w-5 h-5" /> Новий контракт
              </button>
            </div>
          )}

          {parentTab === 'statistics' && (
            <div className="space-y-6">
              <h2 className="text-lg font-bold text-slate-900">Статистика</h2>

              {/* Weekly Activity */}
              <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm">
                <h3 className="font-bold text-slate-900 mb-4">Активність (тиждень)</h3>
                <div className="flex gap-2 items-end h-32">
                  {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'].map((day, i) => {
                    const height = Math.random() * 80 + 20;
                    return (
                      <div key={day} className="flex-1 flex flex-col items-center">
                        <div className="w-full bg-blue-500 rounded-t" style={{ height: `${height}px` }}></div>
                        <p className="text-xs text-slate-600 mt-2">{day}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Weak Topics */}
              <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm">
                <h3 className="font-bold text-slate-900 mb-4">Слабкі теми</h3>
                <div className="space-y-3">
                  {[
                    { name: 'Дроби', accuracy: 62 },
                    { name: 'Граматика англ.', accuracy: 71 },
                    { name: 'Історія', accuracy: 58 },
                  ].map((topic, i) => (
                    <div key={i}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-slate-900 font-medium">{topic.name}</span>
                        <span className="text-slate-600">{topic.accuracy}%</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <div className="bg-orange-500 h-2 rounded-full" style={{ width: `${topic.accuracy}%` }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {parentTab === 'prizes' && (
            <div>
              <h2 className="text-lg font-bold text-slate-900 mb-4">Призи</h2>
              <p className="text-slate-600">Керування призами буде найскоро...</p>
            </div>
          )}

          {parentTab === 'settings' && (
            <div>
              <h2 className="text-lg font-bold text-slate-900 mb-4">Налаштування</h2>
              <button
                onClick={() => {
                  setUserRole(null);
                  setCurrentScreen('splash');
                }}
                className="flex items-center gap-2 text-red-600 hover:text-red-700 font-medium"
              >
                <LogOut className="w-4 h-4" /> Вийти
              </button>
            </div>
          )}
        </div>

        {/* Bottom Navigation */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 max-w-2xl mx-auto">
          <div className="flex justify-around">
            {[
              { tab: 'dashboard', icon: Home, label: 'Панель' },
              { tab: 'statistics', icon: BarChart3, label: 'Статистика' },
              { tab: 'prizes', icon: Gift, label: 'Призи' },
              { tab: 'settings', icon: Settings, label: 'Налаштування' },
            ].map(({ tab, icon: Icon, label }) => (
              <button
                key={tab}
                onClick={() => setParentTab(tab)}
                className={`flex-1 py-4 flex flex-col items-center gap-1 transition-colors ${
                  parentTab === tab ? 'text-blue-600' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs font-medium">{label}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="h-20"></div>
      </div>
    );
  }

  // CONTRACT CREATOR
  if (currentScreen === 'contractCreator' && userRole === 'parent') {
    return (
      <div className="min-h-screen bg-slate-50">
        {/* Header */}
        <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
          <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
            <button
              onClick={() => setCurrentScreen('parentDashboard')}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              ←
            </button>
            <h1 className="text-2xl font-bold text-slate-900">Новий контракт</h1>
          </div>
        </div>

        {/* Form */}
        <div className="max-w-2xl mx-auto px-4 py-6 pb-32">
          <div className="space-y-6">
            {/* Child Selector */}
            <div>
              <label className="block text-sm font-bold text-slate-900 mb-2">Дитина</label>
              <select
                value={contractForm.childId}
                onChange={(e) => setContractForm({ ...contractForm, childId: parseInt(e.target.value) })}
                className="w-full border border-slate-300 rounded-lg px-4 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {mockChildren.map(child => (
                  <option key={child.id} value={child.id}>{child.name} ({child.age} років)</option>
                ))}
              </select>
            </div>

            {/* Subject Selector */}
            <div>
              <label className="block text-sm font-bold text-slate-900 mb-2">Предмет</label>
              <select
                value={contractForm.subject}
                onChange={(e) => setContractForm({ ...contractForm, subject: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-4 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option>Математика</option>
                <option>Английский</option>
                <option>Історія</option>
                <option>Природознавство</option>
              </select>
            </div>

            {/* Grade Selector */}
            <div>
              <label className="block text-sm font-bold text-slate-900 mb-2">Клас</label>
              <select
                value={contractForm.grade}
                onChange={(e) => setContractForm({ ...contractForm, grade: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-4 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option>5 клас</option>
                <option>6 клас</option>
                <option>7 клас</option>
                <option>8 клас</option>
              </select>
            </div>

            {/* Time Per Question */}
            <div>
              <label className="block text-sm font-bold text-slate-900 mb-2">
                Час на питання: {contractForm.timePerQuestion}с
              </label>
              <input
                type="range"
                min="10"
                max="60"
                value={contractForm.timePerQuestion}
                onChange={(e) => setContractForm({ ...contractForm, timePerQuestion: parseInt(e.target.value) })}
                className="w-full h-2 bg-slate-300 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
            </div>

            {/* Points Per Correct */}
            <div>
              <label className="block text-sm font-bold text-slate-900 mb-2">
                Балів за правильну відповідь: +{contractForm.pointsPerCorrect}
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={contractForm.pointsPerCorrect}
                onChange={(e) => setContractForm({ ...contractForm, pointsPerCorrect: parseInt(e.target.value) })}
                className="w-full h-2 bg-green-300 rounded-lg appearance-none cursor-pointer accent-green-600"
              />
            </div>

            {/* Penalty */}
            <div>
              <label className="block text-sm font-bold text-slate-900 mb-2">
                Штраф за помилку: -{contractForm.penalty}
              </label>
              <input
                type="range"
                min="1"
                max="5"
                value={contractForm.penalty}
                onChange={(e) => setContractForm({ ...contractForm, penalty: parseInt(e.target.value) })}
                className="w-full h-2 bg-red-300 rounded-lg appearance-none cursor-pointer accent-red-600"
              />
            </div>

            {/* Prize Section */}
            <div className="border-t border-slate-200 pt-6">
              <h3 className="font-bold text-slate-900 mb-4">🏆 Приз</h3>
              <input
                type="text"
                placeholder="Назва призу (напр. PlayStation 5)"
                value={contractForm.prizeName}
                onChange={(e) => setContractForm({ ...contractForm, prizeName: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-4 py-2 text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
              />
              <div>
                <label className="block text-sm font-bold text-slate-900 mb-2">Вартість у монетах: {contractForm.prizeCoins}</label>
                <input
                  type="range"
                  min="50"
                  max="500"
                  step="10"
                  value={contractForm.prizeCoins}
                  onChange={(e) => setContractForm({ ...contractForm, prizeCoins: parseInt(e.target.value) })}
                  className="w-full h-2 bg-orange-300 rounded-lg appearance-none cursor-pointer accent-orange-600"
                />
              </div>
              <div className="mt-4 border-2 border-dashed border-slate-300 rounded-lg p-8 text-center">
                <p className="text-slate-500 text-sm">📸 Фото призу</p>
              </div>
            </div>

            {/* Create Button */}
            <button
              onClick={() => setCurrentScreen('parentDashboard')}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-4 rounded-lg transition-all transform hover:scale-105 active:scale-95 shadow-lg"
            >
              ✓ Створити контракт
            </button>
          </div>
        </div>
      </div>
    );
  }

  // CHILD HOME
  if (currentScreen === 'childHome' && userRole === 'child') {
    const selectedChild = mockChildren.find(c => c.id === selectedChildId);

    return (
      <div className="min-h-screen bg-slate-50">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-500 text-white sticky top-0 z-10 shadow-md">
          <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-black">Привіт, {selectedChild.name}!</h1>
              <p className="text-blue-100 text-sm">Дозволь заробити монети!</p>
            </div>
            <div className="text-center">
              <p className="text-blue-100 text-xs">Баланс</p>
              <p className="text-3xl font-black">🪙 {childCoins}</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-2xl mx-auto px-4 py-6 pb-32">
          {childTab === 'home' && (
            <div className="space-y-6">
              {/* Streak */}
              <div className="bg-gradient-to-r from-orange-400 to-orange-500 text-white rounded-lg p-4 shadow-md">
                <p className="text-sm opacity-90">Поточна серія</p>
                <p className="text-4xl font-black">🔥 7 днів</p>
              </div>

              {/* Active Contracts */}
              <div>
                <h2 className="text-lg font-bold text-slate-900 mb-4">Активні контракти</h2>
                <div className="space-y-4">
                  {mockContracts
                    .filter(c => c.childId === selectedChildId)
                    .map(contract => (
                      <div key={contract.id} className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h3 className="font-bold text-slate-900">{contract.subject}</h3>
                            <p className="text-sm text-slate-500">{contract.grade}</p>
                          </div>
                          <ChevronRight className="w-5 h-5 text-slate-400" />
                        </div>

                        <div className="mb-4">
                          <div className="flex justify-between text-sm mb-2">
                            <span className="text-slate-600">{contract.prize}</span>
                            <span className="font-bold text-blue-600">{contract.progress}%</span>
                          </div>
                          <div className="w-full bg-slate-200 rounded-full h-3">
                            <div
                              className="bg-green-500 h-3 rounded-full transition-all"
                              style={{ width: `${contract.progress}%` }}
                            ></div>
                          </div>
                        </div>

                        <button
                          onClick={() => handleStartQuiz(contract.id)}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition-all transform hover:scale-105 active:scale-95 text-sm"
                        >
                          <Play className="w-4 h-4" /> Почати тест
                        </button>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}

          {childTab === 'tests' && (
            <div>
              <h2 className="text-lg font-bold text-slate-900 mb-4">Мої тести</h2>
              <p className="text-slate-600">Історія тестів буде найскоро...</p>
            </div>
          )}

          {childTab === 'wallet' && (
            <div className="space-y-6">
              <h2 className="text-lg font-bold text-slate-900 mb-4">Гаманець</h2>

              {/* Balance */}
              <div className="bg-gradient-to-br from-orange-400 to-orange-600 text-white rounded-lg p-8 text-center shadow-lg">
                <p className="text-orange-100 text-sm mb-2">Поточний баланс</p>
                <p className="text-5xl font-black">🪙 {childCoins}</p>
              </div>

              {/* Prize Progress */}
              <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm">
                <h3 className="font-bold text-slate-900 mb-3">PlayStation 5 🎮</h3>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-600">{childCoins} / 500 монет</span>
                  <span className="font-bold text-blue-600">{Math.round((childCoins / 500) * 100)}%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-4">
                  <div
                    className="bg-blue-600 h-4 rounded-full transition-all"
                    style={{ width: `${Math.round((childCoins / 500) * 100)}%` }}
                  ></div>
                </div>
              </div>

              {/* Transaction History */}
              <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm">
                <h3 className="font-bold text-slate-900 mb-4">Історія операцій</h3>
                <div className="space-y-3">
                  {[
                    { type: 'earn', amount: 5, label: 'Математика', time: '2ч назад' },
                    { type: 'earn', amount: 3, label: 'Английский', time: '4ч назад' },
                    { type: 'penalty', amount: 2, label: 'Штраф', time: '1д назад' },
                    { type: 'earn', amount: 7, label: 'Математика', time: '2д назад' },
                  ].map((tx, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <span className="text-slate-600">{tx.label}</span>
                      <div>
                        <p className={`font-bold ${tx.type === 'earn' ? 'text-green-600' : 'text-red-600'}`}>
                          {tx.type === 'earn' ? '+' : '-'}{tx.amount} 🪙
                        </p>
                        <p className="text-slate-500 text-xs">{tx.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {childTab === 'profile' && (
            <div>
              <h2 className="text-lg font-bold text-slate-900 mb-4">Профіль</h2>
              <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm space-y-4">
                <div>
                  <p className="text-sm text-slate-600">Ім'я</p>
                  <p className="font-bold text-slate-900">{selectedChild.name}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Вік</p>
                  <p className="font-bold text-slate-900">{selectedChild.age} років</p>
                </div>
                <button
                  onClick={() => {
                    setUserRole(null);
                    setCurrentScreen('splash');
                  }}
                  className="w-full mt-6 flex items-center justify-center gap-2 text-red-600 hover:text-red-700 font-medium py-2 bg-red-50 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" /> Вийти
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Navigation */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 max-w-2xl mx-auto">
          <div className="flex justify-around">
            {[
              { tab: 'home', icon: Home, label: 'Головна' },
              { tab: 'tests', icon: CheckCircle, label: 'Тести' },
              { tab: 'wallet', icon: TrendingUp, label: 'Гаманець' },
              { tab: 'profile', icon: User, label: 'Профіль' },
            ].map(({ tab, icon: Icon, label }) => (
              <button
                key={tab}
                onClick={() => setChildTab(tab)}
                className={`flex-1 py-4 flex flex-col items-center gap-1 transition-colors ${
                  childTab === tab ? 'text-blue-600' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs font-medium">{label}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="h-20"></div>
      </div>
    );
  }

  // QUIZ SCREEN
  if (currentScreen === 'quiz') {
    const question = quizState.questions[quizState.currentQuestion];
    const progress = ((quizState.currentQuestion + 1) / quizState.questions.length) * 100;

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-700 flex flex-col items-center justify-center p-4">
        {/* Header */}
        <div className="w-full max-w-md mb-8">
          <div className="text-white mb-4">
            <p className="text-sm opacity-90">Питання {quizState.currentQuestion + 1} з {quizState.questions.length}</p>
            <div className="w-full bg-blue-500 rounded-full h-2 mt-2">
              <div className="bg-green-400 h-2 rounded-full transition-all" style={{ width: `${progress}%` }}></div>
            </div>
          </div>

          {/* Timer */}
          <div className="flex justify-center mb-6">
            <div className="relative w-24 h-24">
              <svg className="w-full h-full transform -rotate-90" style={{ filter: 'drop-shadow(0 0 20px rgba(59, 130, 246, 0.5))' }}>
                <circle cx="48" cy="48" r="40" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="4" />
                <circle
                  cx="48"
                  cy="48"
                  r="40"
                  fill="none"
                  stroke="#10B981"
                  strokeWidth="4"
                  strokeDasharray={`${(quizState.timeRemaining / 30) * 251.2} 251.2`}
                  style={{ transition: 'stroke-dasharray 0.1s linear' }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-3xl font-black text-white">{quizState.timeRemaining}</p>
                  <p className="text-xs text-blue-100">сек</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Question */}
        <div className="w-full max-w-md bg-white rounded-lg p-6 mb-6 shadow-xl">
          <h2 className="text-xl font-bold text-slate-900 text-center mb-8">{question.text}</h2>

          {/* Answers Grid */}
          <div className="grid grid-cols-2 gap-3">
            {question.answers.map((answer, index) => (
              <button
                key={index}
                onClick={() => !quizState.isAnswered && handleAnswerSubmit(index)}
                disabled={quizState.isAnswered}
                className={`p-4 rounded-lg font-semibold text-sm transition-all transform ${
                  !quizState.isAnswered
                    ? 'bg-slate-100 text-slate-900 hover:bg-slate-200 active:scale-95'
                    : quizState.selectedAnswer === index
                    ? quizState.isCorrect
                      ? 'bg-green-500 text-white scale-105'
                      : 'bg-red-500 text-white scale-95 animate-pulse'
                    : index === question.correct
                    ? 'bg-green-100 text-green-900 opacity-60'
                    : 'bg-slate-100 text-slate-500 opacity-60'
                } ${quizState.isAnswered ? 'cursor-default' : 'cursor-pointer'}`}
              >
                {answer}
              </button>
            ))}
          </div>
        </div>

        {/* Feedback and Next Button */}
        {quizState.isAnswered && (
          <div className="w-full max-w-md">
            <div className={`text-center mb-4 p-4 rounded-lg ${quizState.isCorrect ? 'bg-green-500' : 'bg-red-500'} text-white`}>
              {quizState.isCorrect ? (
                <div>
                  <p className="text-2xl font-black">✓ Правильно!</p>
                  <p className="text-sm opacity-90">+{5} монет</p>
                </div>
              ) : (
                <div>
                  <p className="text-2xl font-black">✗ Неправильно</p>
                  <p className="text-sm opacity-90">Правильна відповідь: {question.answers[question.correct]}</p>
                </div>
              )}
            </div>

            <button
              onClick={handleNextQuestion}
              className="w-full bg-white text-blue-600 font-bold py-4 px-4 rounded-lg transition-all transform hover:scale-105 active:scale-95 shadow-lg"
            >
              {quizState.currentQuestion < quizState.questions.length - 1 ? 'Наступне питання →' : 'Завершити тест →'}
            </button>
          </div>
        )}
      </div>
    );
  }

  // RESULTS SCREEN
  if (currentScreen === 'results' && quizResults) {
    const percentage = Math.round((quizResults.correct / quizResults.total) * 100);
    const stars = percentage >= 90 ? 3 : percentage >= 70 ? 2 : 1;

    return (
      <div className="min-h-screen bg-gradient-to-br from-green-600 to-green-700 flex flex-col items-center justify-center p-4">
        {/* Celebration */}
        {percentage >= 70 && (
          <div className="fixed inset-0 pointer-events-none">
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className="absolute animate-bounce"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animation: `bounce ${2 + Math.random()}s infinite`,
                  animationDelay: `${Math.random()}s`,
                }}
              >
                {['🎉', '⭐', '🏆'][Math.floor(Math.random() * 3)]}
              </div>
            ))}
          </div>
        )}

        <div className="w-full max-w-md z-10">
          {/* Score */}
          <div className="text-center mb-8">
            <p className="text-white text-lg opacity-90 mb-2">Твій результат</p>
            <div className="text-7xl font-black text-white mb-4">{percentage}%</div>

            {/* Stars */}
            <div className="flex justify-center gap-2 mb-6">
              {[...Array(3)].map((_, i) => (
                <span key={i} className={`text-4xl ${i < stars ? 'animate-bounce' : 'opacity-30'}`}>
                  ⭐
                </span>
              ))}
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-3 gap-3 mb-8">
            <div className="bg-white bg-opacity-20 backdrop-blur text-white rounded-lg p-4 text-center">
              <p className="text-sm opacity-90">Правильно</p>
              <p className="text-3xl font-black">{quizResults.correct}</p>
            </div>
            <div className="bg-white bg-opacity-20 backdrop-blur text-white rounded-lg p-4 text-center">
              <p className="text-sm opacity-90">Всього</p>
              <p className="text-3xl font-black">{quizResults.total}</p>
            </div>
            <div className="bg-white bg-opacity-20 backdrop-blur text-white rounded-lg p-4 text-center">
              <p className="text-sm opacity-90">Монет</p>
              <p className="text-3xl font-black text-orange-300">+{quizResults.score}</p>
            </div>
          </div>

          {/* Buttons */}
          <div className="space-y-3">
            <button
              onClick={() => handleStartNewQuiz()}
              className="w-full bg-white text-green-600 font-bold py-4 px-4 rounded-lg transition-all transform hover:scale-105 active:scale-95 shadow-lg"
            >
              На головну →
            </button>
            <button
              onClick={() => handleStartQuiz(1)}
              className="w-full bg-green-800 hover:bg-green-900 text-white font-bold py-4 px-4 rounded-lg transition-all transform hover:scale-105 active:scale-95 shadow-lg"
            >
              Повторити тест
            </button>
          </div>
        </div>

        <style>{`
          @keyframes bounce {
            0%, 100% { transform: translateY(0) rotate(0deg); opacity: 1; }
            50% { transform: translateY(-30px) rotate(180deg); }
            100% { opacity: 0; transform: translateY(-100px); }
          }
        `}</style>
      </div>
    );
  }

  return null;
};

export default BrainCoinApp;
