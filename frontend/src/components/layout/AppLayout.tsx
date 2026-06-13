import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import StarField from '@/components/StarField'

export default function AppLayout() {
    return (
        <div className="flex h-screen overflow-hidden" style={{ background: '#020818' }}>
            <StarField />
            <div className="relative z-10 flex w-full h-full">
                <Sidebar />
                <div className="flex flex-1 flex-col overflow-hidden">
                    <main className="flex-1 overflow-y-auto">
                        <Outlet />
                    </main>
                </div>
            </div>
        </div>
    )
}