'use client';

import { useAppStore } from '@/stores/app-store';
import { Sidebar } from './sidebar';
import { MobileNav } from './mobile-nav';
import { Header } from './header';
import { DashboardView } from './dashboard-view';
import { CatalogoView } from './catalogo-view';
import { ProductoFormView } from './producto-form-view';
import { ProductoDetalleView } from './producto-detalle-view';
import { CotizacionesView } from './cotizaciones-view';
import { CotizacionFormView } from './cotizacion-form-view';
import { CotizacionDetalleView } from './cotizacion-detalle-view';
import { EntregasView } from './entregas-view';
import { EntregaFormView } from './entrega-form-view';
import { UsuariosView } from './usuarios-view';
import { UsuarioFormView } from './usuario-form-view';
import { ConfiguracionView } from './configuracion-view';

export function AppShell() {
  const currentView = useAppStore(s => s.currentView);
  const sidebarOpen = useAppStore(s => s.sidebarOpen);

  const renderView = () => {
    switch (currentView) {
      case 'dashboard': return <DashboardView />;
      case 'catalogo': return <CatalogoView />;
      case 'producto-detalle': return <ProductoDetalleView />;
      case 'producto-form': return <ProductoFormView />;
      case 'cotizaciones': return <CotizacionesView />;
      case 'cotizacion-form': return <CotizacionFormView />;
      case 'cotizacion-detalle': return <CotizacionDetalleView />;
      case 'entregas': return <EntregasView />;
      case 'entrega-form': return <EntregaFormView />;
      case 'usuarios': return <UsuariosView />;
      case 'usuario-form': return <UsuarioFormView />;
      case 'configuracion': return <ConfiguracionView />;
      default: return <DashboardView />;
    }
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 border-r border-border bg-white">
        <Sidebar />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="fixed inset-0 bg-black/30"
            onClick={() => useAppStore.getState().setSidebarOpen(false)}
          />
          <aside className="fixed inset-y-0 left-0 w-64 bg-white z-50 animate-fade-in">
            <Sidebar onClose={() => useAppStore.getState().setSidebarOpen(false)} />
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 p-4 md:p-6 pb-20 lg:pb-6 overflow-auto">
          <div className="animate-fade-in">
            {renderView()}
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileNav />
    </div>
  );
}
