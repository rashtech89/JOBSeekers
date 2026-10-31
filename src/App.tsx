import { Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import Jobs from './pages/Jobs'
import JobDetail from './pages/JobDetail'
import Upload from './pages/Upload'
import AdminGate from './pages/AdminGate'
import AuthPage from './pages/AuthPage'
import Account from './pages/Account'
import { ADMIN_PATH } from './config'
import StaticPage from './pages/StaticPage'
import NotFound from './pages/NotFound'
import CvBuilder from './pages/CvBuilder'

const staticPaths = ['companies', 'employer', 'contact', 'help', 'safety', 'privacy', 'terms', 'cookies']

export default function App() {
  return <Routes><Route element={<Layout/>}>
    <Route index element={<Home/>}/>
    <Route path="jobs" element={<Jobs/>}/>
    <Route path="job/:id" element={<JobDetail/>}/>
    <Route path="employer/upload" element={<Upload/>}/>
    <Route path="cv-builder" element={<CvBuilder/>}/>
    <Route path="p/:slug" element={<StaticPage/>}/>
    <Route path="login" element={<AuthPage mode="login"/>}/>
    <Route path="register" element={<AuthPage mode="register"/>}/>
    <Route path="account" element={<Account/>}/>
    {ADMIN_PATH && <Route path={ADMIN_PATH.replace(/^\//, '')} element={<AdminGate/>}/>}
    {staticPaths.map(path => <Route key={path} path={path} element={<StaticPage/>}/>)}
    <Route path="*" element={<NotFound/>}/>
  </Route></Routes>
}
