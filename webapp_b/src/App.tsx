import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout/Layout'
import Dashboard from './pages/Dashboard/Dashboard'
import Customers from './pages/Customers/Customers'
import CustomerDetail from './pages/CustomerDetail/CustomerDetail'
import Reports from './pages/Reports/Reports'
import ReportDetail from './pages/ReportDetail/ReportDetail'
import Parsing from './pages/Parsing/Parsing'
import BankCenter from './pages/BankCenter/BankCenter'
import BankDetail from './pages/BankDetail/BankDetail'
import Templates from './pages/Settings/Templates'
import Membership from './pages/Settings/Membership'
import UsageLogs from './pages/Settings/UsageLogs'
import OrgAccounts from './pages/Settings/OrgAccounts'
import ApiConfig from './pages/Settings/ApiConfig'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="customers" element={<Customers />} />
        <Route path="customers/:id" element={<CustomerDetail />} />
        <Route path="reports" element={<Reports />} />
        <Route path="reports/:id" element={<ReportDetail />} />
        <Route path="parsing" element={<Parsing />} />
        <Route path="banks" element={<BankCenter />} />
        <Route path="banks/:id" element={<BankDetail />} />
        <Route path="settings/templates" element={<Templates />} />
        <Route path="settings/membership" element={<Membership />} />
        <Route path="settings/usage" element={<UsageLogs />} />
        <Route path="settings/accounts" element={<OrgAccounts />} />
        <Route path="settings/api" element={<ApiConfig />} />
      </Route>
    </Routes>
  )
}
