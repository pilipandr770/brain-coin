import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

import SplashScreen    from './screens/SplashScreen';
import LoginScreen     from './screens/LoginScreen';
import RegisterScreen  from './screens/RegisterScreen';
import InviteAccept    from './screens/InviteAccept';

import ParentLayout    from './screens/parent/ParentLayout';
import ParentDashboard from './screens/parent/ParentDashboard';
import ContractCreator from './screens/parent/ContractCreator';
import CreateChild     from './screens/parent/CreateChild';
import ParentStats     from './screens/parent/ParentStats';
import PaymentScreen   from './screens/parent/PaymentScreen';
import AdminDashboard  from './screens/parent/AdminDashboard';

import ChildLayout     from './screens/child/ChildLayout';
import ChildHome       from './screens/child/ChildHome';
import ContractView    from './screens/child/ContractView';
import QuizScreen      from './screens/child/QuizScreen';
import ResultsScreen   from './screens/child/ResultsScreen';
import Leaderboard     from './screens/child/Leaderboard';
import FriendsScreen   from './screens/child/FriendsScreen';
import ChatScreen      from './screens/child/ChatScreen';
import ChallengeScreen from './screens/child/ChallengeScreen';
import MistakeReview   from './screens/child/MistakeReview';

import Impressum    from './screens/legal/Impressum';
import Datenschutz  from './screens/legal/Datenschutz';
import AGB          from './screens/legal/AGB';

function Guard({ children, role }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role && user.role !== 'admin') return <Navigate to="/" replace />;
  return children;
}

function RootRedirect() {
  const { user } = useAuth();
  if (!user) return <SplashScreen />;
  if (user.role === 'admin') return <Navigate to="/admin" replace />;
  return <Navigate to={user.role === 'parent' ? '/parent' : '/child'} replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/"        element={<RootRedirect />} />
          <Route path="/login"   element={<LoginScreen />} />
          <Route path="/register" element={<RegisterScreen />} />
          <Route path="/invite/:code" element={<InviteAccept />} />

          {/* Legal pages — public, no auth required */}
          <Route path="/impressum"    element={<Impressum />} />
          <Route path="/datenschutz"  element={<Datenschutz />} />
          <Route path="/agb"          element={<AGB />} />

          {/* Parent */}
          <Route path="/parent" element={<Guard role="parent"><ParentLayout /></Guard>}>
            <Route index          element={<ParentDashboard />} />
            <Route path="contracts/new" element={<ContractCreator />} />
            <Route path="children/new"  element={<CreateChild />} />
            <Route path="payment"       element={<PaymentScreen />} />
          </Route>
          <Route path="/parent/stats/:childId" element={<Guard role="parent"><ParentStats /></Guard>} />
          <Route path="/admin" element={<Guard role="admin"><AdminDashboard /></Guard>} />

          {/* Child — tabbed layout screens */}
          <Route path="/child" element={<Guard role="child"><ChildLayout /></Guard>}>
            <Route index            element={<ChildHome />} />
            <Route path="leaderboard" element={<Leaderboard />} />
            <Route path="friends"     element={<FriendsScreen />} />
            <Route path="friends/:id/chat" element={<ChatScreen />} />
          </Route>

          {/* Child — full-screen flows (no layout nav) */}
          <Route path="/child/contract/:id" element={<Guard role="child"><ContractView /></Guard>} />
          <Route path="/child/quiz/:sessionId" element={<Guard role="child"><QuizScreen /></Guard>} />
          <Route path="/child/results/:sessionId" element={<Guard role="child"><ResultsScreen /></Guard>} />
          <Route path="/child/mistakes" element={<Guard role="child"><MistakeReview /></Guard>} />
          <Route path="/child/challenges" element={<Guard role="child"><ChallengeScreen /></Guard>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
