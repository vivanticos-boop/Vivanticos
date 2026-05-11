'use client';

import { useState, useMemo, useEffect } from 'react';
import { useAppStore } from '@/stores/app-store';
import { useEntregasStore } from '@/stores/entregas-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import {
  Truck,
  ChevronLeft,
  ChevronRight,
  Plus,
  MapPin,
  Phone,
  Package,
  Calendar as CalendarIcon,
  Clock,
  Eye,
  Search,
} from 'lucide-react';
import {
  formatDate,
  getEstadoEntregaColor,
  getMonthName,
  generateId,
} from '@/lib/utils';
import { toast } from 'sonner';
import type { EstadoEntrega, Entrega } from '@/types';
import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  format,
  isSameDay,
  isSameMonth,
  addMonths,
  subMonths,
  isToday,
  getDay,
  startOfWeek,
  endOfWeek,
} from 'date-fns';
import { es } from 'date-fns/locale';

type FilterTab = 'todas' | 'pendiente' | 'entregado' | 'completado';

const ESTADO_LABELS: Record<EstadoEntrega, string> = {
  pendiente: 'Pendiente',
  entregado: 'Entregado',
  completado: 'Completado',
};

const ESTADO_DOT_COLORS: Record<EstadoEntrega, string> = {
  pendiente: 'bg-[#9BACAD]',
  entregado: 'bg-[#B3BA95]',
  completado: 'bg-[#D7C1A8]',
};

const FILTER_TABS: { key: FilterTab; label: string; color: string }[] = [
  { key: 'todas', label: 'Todas', color: 'bg-muted' },
  { key: 'pendiente', label: 'Pendientes', color: 'bg-[#9BACAD]' },
  { key: 'entregado', label: 'Entregadas', color: 'bg-[#B3BA95]' },
  { key: 'completado', label: 'Completadas', color: 'bg-[#D7C1A8]' },
];

export function EntregasView() {
  const navigateTo = useAppStore(s => s.navigateTo);
  const setSelectedEntregaId = useAppStore(s => s.setSelectedEntregaId);
  const selectedEntregaId = useAppStore(s => s.selectedEntregaId);
  const setSelectedCotizacionId = useAppStore(s => s.setSelectedCotizacionId);

  const entregas = useEntregasStore(s => s.entregas);
  const updateEstado = useEntregasStore(s => s.updateEstado);
  const updateEstadoSupabase = useEntregasStore(s => s.updateEstadoSupabase);
  const getEntrega = useEntregasStore(s => s.getEntrega);
  const loadFromSupabase = useEntregasStore(s => s.loadFromSupabase);
  const isLoading = useEntregasStore(s => s.isLoading);

  // Cargar datos de Supabase al montar
  useEffect(() => {
    loadFromSupabase();
  }, [loadFromSupabase]);

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [filterTab, setFilterTab] = useState<FilterTab>('todas');
  const [searchTerm, setSearchTerm] = useState('');

  // Calendar calculations
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

  const calendarDays = useMemo(
    () => eachDayOfInterval({ start: calendarStart, end: calendarEnd }),
    [calendarStart, calendarEnd]
  );

  // Map deliveries by date string for quick lookup
  const entregasByDate = useMemo(() => {
    const map: Record<string, Entrega[]> = {};
    entregas.forEach(e => {
      if (!map[e.fecha_entrega]) map[e.fecha_entrega] = [];
      map[e.fecha_entrega].push(e);
    });
    return map;
  }, [entregas]);

  // Get deliveries for selected date
  const selectedDateStr = selectedDate
    ? format(selectedDate, 'yyyy-MM-dd')
    : null;

  const deliveriesForSelectedDate = useMemo(() => {
    if (selectedDateStr) {
      return entregasByDate[selectedDateStr] || [];
    }
    // If no date selected, show upcoming deliveries (next 7 days)
    const today = new Date();
    const next7 = new Date(today);
    next7.setDate(next7.getDate() + 7);
    return entregas
      .filter(e => {
        const d = new Date(e.fecha_entrega + 'T00:00:00');
        return d >= today && d <= next7;
      })
      .sort((a, b) => a.fecha_entrega.localeCompare(b.fecha_entrega));
  }, [selectedDateStr, entregasByDate, entregas]);

  // Apply filter tab
  const filteredDeliveries = useMemo(() => {
    if (filterTab === 'todas') return deliveriesForSelectedDate;
    return deliveriesForSelectedDate.filter(e => e.estado === filterTab);
  }, [deliveriesForSelectedDate, filterTab]);

  // Apply search filter
  const searchFiltered = useMemo(() => {
    if (!searchTerm.trim()) return filteredDeliveries;
    const term = searchTerm.toLowerCase();
    return filteredDeliveries.filter(e =>
      e.cliente_nombre.toLowerCase().includes(term) ||
      (e.cliente_cedula && e.cliente_cedula.includes(term)) ||
      e.cliente_telefono.includes(term)
    );
  }, [filteredDeliveries, searchTerm]);

  // Selected entrega detail
  const selectedEntrega = selectedEntregaId ? getEntrega(selectedEntregaId) : null;

  // Navigation helpers
  const goToPrevMonth = () => setCurrentMonth(prev => subMonths(prev, 1));
  const goToNextMonth = () => setCurrentMonth(prev => addMonths(prev, 1));
  const goToToday = () => {
    setCurrentMonth(new Date());
    setSelectedDate(new Date());
  };

  // Handle estado change
  const handleEstadoChange = (entregaId: string, newEstado: EstadoEntrega) => {
    updateEstado(entregaId, newEstado);
    updateEstadoSupabase(entregaId, newEstado);
    toast.success(`Estado actualizado a ${ESTADO_LABELS[newEstado]}`);
  };

  // Day of week headers
  const weekDays = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  return (
    <div className="space-y-4 md:space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2
            className="text-xl md:text-2xl font-bold"
            style={{ fontFamily: 'var(--font-league-spartan)' }}
          >
            Entregas
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Calendario y seguimiento de entregas
          </p>
        </div>
        <Button
          className="bg-viv-sage hover:bg-viv-sage-dark text-white"
          onClick={() => {
            setSelectedEntregaId(null);
            setSelectedCotizacionId(null);
            navigateTo('entrega-form');
          }}
        >
          <Plus size={16} className="mr-2" />
          Nueva Entrega
        </Button>
      </div>

      {/* Search by cédula or nombre */}
      <div className="relative">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          placeholder="Buscar por nombre, cédula o teléfono..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="pl-9 h-10"
        />
      </div>

      {/* Calendar Section */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={goToPrevMonth}
              aria-label="Mes anterior"
            >
              <ChevronLeft size={18} />
            </Button>
            <div className="flex items-center gap-2">
              <h3
                className="text-base md:text-lg font-bold"
                style={{ fontFamily: 'var(--font-league-spartan)' }}
              >
                {getMonthName(currentMonth.getMonth())} {currentMonth.getFullYear()}
              </h3>
              {!isSameMonth(currentMonth, new Date()) && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-viv-sage-dark hover:text-viv-sage-dark hover:bg-viv-sage/10"
                  onClick={goToToday}
                >
                  Hoy
                </Button>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={goToNextMonth}
              aria-label="Mes siguiente"
            >
              <ChevronRight size={18} />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pb-3">
          {/* Week day headers */}
          <div className="grid grid-cols-7 gap-0 mb-1">
            {weekDays.map(day => (
              <div
                key={day}
                className="text-center text-[10px] md:text-xs font-semibold text-muted-foreground uppercase tracking-wider py-1"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-0">
            {calendarDays.map(day => {
              const dateStr = format(day, 'yyyy-MM-dd');
              const dayEntregas = entregasByDate[dateStr] || [];
              const isCurrentMonth = isSameMonth(day, currentMonth);
              const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;
              const isTodayDate = isToday(day);

              // Count by estado for dots
              const pendienteCount = dayEntregas.filter(e => e.estado === 'pendiente').length;
              const entregadoCount = dayEntregas.filter(e => e.estado === 'entregado').length;
              const completadoCount = dayEntregas.filter(e => e.estado === 'completado').length;

              return (
                <button
                  key={dateStr}
                  onClick={() => setSelectedDate(day)}
                  className={`
                    relative flex flex-col items-center justify-center
                    h-10 md:h-14 transition-colors rounded-lg mx-0.5
                    ${isCurrentMonth ? 'text-foreground' : 'text-muted-foreground/40'}
                    ${isSelected ? 'bg-viv-sage/20 ring-2 ring-viv-sage/50' : 'hover:bg-muted/60'}
                    ${isTodayDate && !isSelected ? 'bg-viv-sage/10 font-bold' : ''}
                    ${dayEntregas.length > 0 && !isSelected ? 'bg-viv-sage/8' : ''}
                  `}
                  aria-label={`${format(day, 'd')} de ${format(day, 'MMMM', { locale: es })}`}
                >
                  <span
                    className={`text-xs md:text-sm leading-none ${
                      isTodayDate ? 'text-viv-sage-dark font-bold' : ''
                    } ${
                      dayEntregas.length > 0 && !isSelected ? 'font-bold' : ''
                    }`}
                  >
                    {format(day, 'd')}
                  </span>
                  {/* Delivery indicators - more visible */}
                  {dayEntregas.length > 0 && (
                    <div className="flex items-center gap-[3px] mt-1">
                      {pendienteCount > 0 && (
                        <span className="w-2 h-2 md:w-2.5 md:h-2.5 rounded-full bg-[#9BACAD] ring-1 ring-[#9BACAD]/40 shadow-sm" />
                      )}
                      {entregadoCount > 0 && (
                        <span className="w-2 h-2 md:w-2.5 md:h-2.5 rounded-full bg-[#B3BA95] ring-1 ring-[#B3BA95]/40 shadow-sm" />
                      )}
                      {completadoCount > 0 && (
                        <span className="w-2 h-2 md:w-2.5 md:h-2.5 rounded-full bg-[#D7C1A8] ring-1 ring-[#D7C1A8]/40 shadow-sm" />
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Calendar legend */}
          <div className="flex items-center justify-center gap-4 mt-3 pt-2 border-t border-border/50">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-[#9BACAD] ring-1 ring-[#9BACAD]/40 shadow-sm" />
              <span className="text-[10px] text-muted-foreground">Pendiente</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-[#B3BA95] ring-1 ring-[#B3BA95]/40 shadow-sm" />
              <span className="text-[10px] text-muted-foreground">Entregado</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-[#D7C1A8] ring-1 ring-[#D7C1A8]/40 shadow-sm" />
              <span className="text-[10px] text-muted-foreground">Completado</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Selected date info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <CalendarIcon size={16} className="text-viv-sage-dark" />
          <h3
            className="text-base font-bold"
            style={{ fontFamily: 'var(--font-league-spartan)' }}
          >
            {selectedDate
              ? format(selectedDate, "EEEE d 'de' MMMM, yyyy", { locale: es })
              : 'Próximas entregas (7 días)'}
          </h3>
          {selectedDate && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-[10px] text-muted-foreground hover:text-foreground"
              onClick={() => setSelectedDate(null)}
            >
              Ver próximas
            </Button>
          )}
        </div>
        <span className="text-xs text-muted-foreground">
          {searchFiltered.length} entrega{searchFiltered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {FILTER_TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilterTab(tab.key)}
            className={`
              flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium
              transition-colors whitespace-nowrap flex-shrink-0
              ${
                filterTab === tab.key
                  ? 'bg-foreground text-background'
                  : 'bg-muted/60 text-muted-foreground hover:bg-muted'
              }
            `}
          >
            <span
              className={`w-2 h-2 rounded-full ${tab.color} ${
                filterTab === tab.key ? 'ring-1 ring-background/30' : ''
              }`}
            />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Delivery Cards */}
      {searchFiltered.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="py-12 text-center">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-viv-bluegrey/10 flex items-center justify-center mb-3">
              <Truck size={24} className="text-viv-bluegrey/50" />
            </div>
            <p className="text-sm text-muted-foreground">
              No hay entregas {selectedDate ? 'para esta fecha' : 'próximas'}
            </p>
            {(filterTab !== 'todas' || selectedDate) && (
              <Button
                variant="ghost"
                size="sm"
                className="mt-2 text-xs"
                onClick={() => {
                  setFilterTab('todas');
                  setSelectedDate(null);
                }}
              >
                Ver todas las entregas
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {searchFiltered.map(entrega => (
            <Card
              key={entrega.id}
              className={`border-0 shadow-sm transition-all cursor-pointer hover:shadow-md ${
                selectedEntregaId === entrega.id ? 'ring-2 ring-viv-sage/50' : ''
              }`}
              onClick={() => setSelectedEntregaId(entrega.id)}
            >
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                  {/* Left icon */}
                  <div
                    className={`p-2.5 rounded-xl flex-shrink-0 ${
                      entrega.estado === 'pendiente'
                        ? 'bg-[#9BACAD]/15'
                        : entrega.estado === 'entregado'
                        ? 'bg-[#B3BA95]/15'
                        : 'bg-[#D7C1A8]/15'
                    }`}
                  >
                    <Truck
                      size={18}
                      className={
                        entrega.estado === 'pendiente'
                          ? 'text-[#9BACAD]'
                          : entrega.estado === 'entregado'
                          ? 'text-[#B3BA95]'
                          : 'text-[#D7C1A8]'
                      }
                    />
                  </div>

                  {/* Main info */}
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-semibold text-sm truncate">
                          {entrega.cliente_nombre}
                        </p>
                        <div className="flex items-center gap-1 mt-0.5">
                          <CalendarIcon size={12} className="text-muted-foreground flex-shrink-0" />
                          <span className="text-xs text-muted-foreground">
                            {formatDate(entrega.fecha_entrega)}
                            {entrega.hora_entrega && ` · ${entrega.hora_entrega}`}
                          </span>
                        </div>
                      </div>
                      <Badge
                        className={`text-[10px] px-2.5 py-0.5 h-6 border-0 flex-shrink-0 ${getEstadoEntregaColor(entrega.estado)}`}
                      >
                        {ESTADO_LABELS[entrega.estado]}
                      </Badge>
                    </div>

                    {/* Address */}
                    <div className="flex items-start gap-1.5">
                      <MapPin size={12} className="text-muted-foreground mt-0.5 flex-shrink-0" />
                      <span className="text-xs text-muted-foreground line-clamp-1">
                        {entrega.cliente_direccion}
                      </span>
                    </div>

                    {/* Items summary */}
                    <div className="flex items-center gap-1.5">
                      <Package size={12} className="text-muted-foreground flex-shrink-0" />
                      <span className="text-xs text-muted-foreground">
                        {entrega.items.length} item{entrega.items.length !== 1 ? 's' : ''}:
                        {' '}
                        {entrega.items.map(i => i.producto_nombre).join(', ')}
                      </span>
                    </div>

                    {/* Phone */}
                    <div className="flex items-center gap-1.5">
                      <Phone size={12} className="text-muted-foreground flex-shrink-0" />
                      <span className="text-xs text-muted-foreground">
                        {entrega.cliente_telefono}
                      </span>
                    </div>

                    {/* Cédula */}
                    {entrega.cliente_cedula && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-semibold text-muted-foreground">CC:</span>
                        <span className="text-xs text-muted-foreground">{entrega.cliente_cedula}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Expanded detail + Estado change */}
                {selectedEntregaId === entrega.id && (
                  <div className="mt-3 pt-3 border-t border-border/50 animate-fade-in">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      {/* Items detail */}
                      <div className="space-y-1.5 flex-1">
                        {entrega.items.map(item => (
                          <div
                            key={item.id}
                            className="flex items-center gap-2 text-xs"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-viv-sage flex-shrink-0" />
                            <span className="font-medium">{item.producto_nombre}</span>
                            <span className="text-muted-foreground">×{item.cantidad}</span>
                            {item.configuracion && (
                              <span className="text-muted-foreground italic">
                                ({item.configuracion})
                              </span>
                            )}
                          </div>
                        ))}
                        {entrega.notas && (
                          <p className="text-xs text-muted-foreground italic mt-2 pl-3.5">
                            📝 {entrega.notas}
                          </p>
                        )}
                      </div>

                      {/* Estado change controls */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                          Cambiar estado:
                        </span>
                        <Select
                          value={entrega.estado}
                          onValueChange={(v: EstadoEntrega) =>
                            handleEstadoChange(entrega.id, v)
                          }
                        >
                          <SelectTrigger className="h-8 w-[130px] text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pendiente">
                              <span className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-[#9BACAD]" />
                                Pendiente
                              </span>
                            </SelectItem>
                            <SelectItem value="entregado">
                              <span className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-[#B3BA95]" />
                                Entregado
                              </span>
                            </SelectItem>
                            <SelectItem value="completado">
                              <span className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-[#D7C1A8]" />
                                Completado
                              </span>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedEntregaId(null);
                            navigateTo('entrega-form');
                            // Set the entrega id for editing
                            useAppStore.getState().setSelectedEntregaId(entrega.id);
                          }}
                        >
                          <Eye size={12} className="mr-1" />
                          Editar
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Summary stats */}
      <Card className="border-0 shadow-sm bg-gradient-to-r from-viv-sage/5 via-viv-peach/5 to-viv-bluegrey/5">
        <CardContent className="p-4">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-lg md:text-xl font-bold text-[#9BACAD]" style={{ fontFamily: 'var(--font-league-spartan)' }}>
                {entregas.filter(e => e.estado === 'pendiente').length}
              </p>
              <p className="text-[10px] md:text-xs text-muted-foreground">Pendientes</p>
            </div>
            <div>
              <p className="text-lg md:text-xl font-bold text-[#B3BA95]" style={{ fontFamily: 'var(--font-league-spartan)' }}>
                {entregas.filter(e => e.estado === 'entregado').length}
              </p>
              <p className="text-[10px] md:text-xs text-muted-foreground">Entregadas</p>
            </div>
            <div>
              <p className="text-lg md:text-xl font-bold text-[#D7C1A8]" style={{ fontFamily: 'var(--font-league-spartan)' }}>
                {entregas.filter(e => e.estado === 'completado').length}
              </p>
              <p className="text-[10px] md:text-xs text-muted-foreground">Completadas</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
