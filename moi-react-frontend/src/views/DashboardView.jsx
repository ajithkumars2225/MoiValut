import React, { useState } from 'react';
import {
    ResponsiveContainer,
    AreaChart,
    Area,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
} from 'recharts';
import {
    Users,
    IndianRupee,
    Coins,
    MapPin,
    Award,
    Plus,
    TrendingUp,
    PieChart as PieIcon,
    BarChart3,
    Activity,
    Crown,
    Sparkles,
    Printer,
    ArrowUpRight,
} from 'lucide-react';
import { ReceiptModal } from '../components/ReceiptModal';

export const DashboardView = ({
    event,
    transactions,
    goldEntries,
    givenEntries = [],
    onNavigate,
    onOpenCreateEvent,
}) => {
    const [selectedReceipt, setSelectedReceipt] = useState(null);

    if (!event) {
        return (
            <div className="empty-event-hero">
                <div className="hero-card">
                    <Award size={48} className="hero-icon" />
                    <h2>No Event Selected</h2>
                    <p>Please select an existing event from the top header or create a new event to start managing collections.</p>
                    <button className="btn btn-primary btn-lg" onClick={onOpenCreateEvent}>
                        <Plus size={20} /> Create First Event
                    </button>
                </div>
            </div>
        );
    }

    // Financial Calculations
    const totalCash = transactions.reduce((acc, t) => acc + Number(t.amount || 0), 0);
    const totalContributorsCount = new Set([
        ...transactions.map((t) => `${t.contributorName}-${t.village}`),
        ...goldEntries.map((g) => `${g.contributorName}-${g.village}`),
    ]).size;

    // Highest Single Cash Gift
    const highestTx = [...transactions].sort((a, b) => Number(b.amount) - Number(a.amount))[0];

    // Given Moi Calculations
    const totalGivenMoiAmount = givenEntries.reduce((acc, g) => acc + Number(g.amount || 0), 0);
    const totalGivenMoiCount = givenEntries.length;
    const totalGivenMoiVillagesCount = new Set(givenEntries.map(g => g.village).filter(Boolean)).size;

    // Village Leaderboard Map
    const villageMap = {};
    const villageContributorsMap = {};
    transactions.forEach((t) => {
        const v = t.village || 'Unspecified';
        villageMap[v] = (villageMap[v] || 0) + Number(t.amount || 0);
        if (!villageContributorsMap[v]) villageContributorsMap[v] = new Set();
        villageContributorsMap[v].add(t.contributorName);
    });

    const topVillagesList = Object.entries(villageMap)
        .map(([name, total]) => ({
            name,
            total,
            contributors: villageContributorsMap[name]?.size || 0,
        }))
        .sort((a, b) => b.total - a.total);

    const topVillageLeader = topVillagesList[0] || { name: '-', total: 0 };
    const totalVillagesCount = topVillagesList.length;

    // Top 5 Cash Contributors Wall of Fame
    const topContributorsWall = [...transactions]
        .sort((a, b) => Number(b.amount) - Number(a.amount))
        .slice(0, 5);

    // Chart 1: Timeline Area Data
    let cumulative = 0;
    const timelineData = transactions.map((t, idx) => {
        cumulative += Number(t.amount || 0);
        return {
            index: idx + 1,
            label: `#${t.serialNumber} ${t.contributorName}`,
            amount: Number(t.amount || 0),
            cumulative: cumulative,
        };
    });

    // Chart 2: Top Villages Bar Chart
    const villageChartData = topVillagesList.slice(0, 7);

    // Chart 3: Cash vs Gold Pie Chart
    const giftTypeData = [
        { name: 'Cash Gifts (பணம்)', value: transactions.length, color: '#8B5CF6' },
        { name: 'Gold Gifts (பொன்)', value: goldEntries.length, color: '#F59E0B' },
    ].filter((item) => item.value > 0);

    // Chart 4: Amount Tier Distribution
    const tiers = {
        '< ₹500': 0,
        '₹501 - ₹2,000': 0,
        '₹2,001 - ₹5,000': 0,
        '> ₹5,000': 0,
    };

    transactions.forEach((t) => {
        const amt = Number(t.amount || 0);
        if (amt <= 500) tiers['< ₹500'] += 1;
        else if (amt <= 2000) tiers['₹501 - ₹2,000'] += 1;
        else if (amt <= 5000) tiers['₹2,001 - ₹5,000'] += 1;
        else tiers['> ₹5,000'] += 1;
    });

    const tierData = Object.entries(tiers).map(([tier, count]) => ({ tier, count }));

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="glass-chart-tooltip">
                    <p className="tooltip-title">{payload[0].payload?.label || label}</p>
                    {payload.map((entry, idx) => (
                        <p key={idx} className="tooltip-val" style={{ color: entry.color || '#8B5CF6' }}>
                            {entry.name}: {typeof entry.value === 'number' && entry.name !== 'count' ? `₹ ${entry.value.toLocaleString('en-IN')}` : entry.value}
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    return (
        <div className="view-content fade-in">
            {/* 📥 INBOUND COLLECTIONS SUMMARY 📥 */}
            <div className="card-header-flex mb-3">
                <div className="title-block">
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-header)', display: 'flex', alignItems: 'center', gap: '0.45rem', margin: 0 }}>
                        <Sparkles size={16} className="text-purple" /> Collections Summary (பெறப்பட்ட மொய் விபரம்)
                    </h3>
                </div>
            </div>

            {/* 📊 COMPACT 3-COLUMN KPI METRIC GRID 📊 */}
            <div className="kpi-3-col-grid mb-4">
                {/* 1. Total Cash */}
                <div className="kpi-card glass-card purple-kpi">
                    <div className="kpi-top">
                        <span className="kpi-title">Total Cash Collected</span>
                        <div className="kpi-icon-bg purple-icon"><IndianRupee size={18} /></div>
                    </div>
                    <h2 className="kpi-value text-purple">₹ {totalCash.toLocaleString('en-IN')}</h2>
                    <span className="kpi-foot font-tamil">மொத்த பண மொய்</span>
                </div>

                {/* 2. Total Contributors */}
                <div className="kpi-card glass-card blue-kpi">
                    <div className="kpi-top">
                        <span className="kpi-title">Total Contributors</span>
                        <div className="kpi-icon-bg blue-icon"><Users size={18} /></div>
                    </div>
                    <h2 className="kpi-value">{totalContributorsCount} Persons</h2>
                    <span className="kpi-foot font-tamil">மொத்த நபர்கள்</span>
                </div>

                {/* 3. Total Villages Count */}
                <div className="kpi-card glass-card emerald-kpi">
                    <div className="kpi-top">
                        <span className="kpi-title">Total Villages Count</span>
                        <div className="kpi-icon-bg emerald-icon"><MapPin size={18} /></div>
                    </div>
                    <h2 className="kpi-value text-emerald">{totalVillagesCount} Villages</h2>
                    <span className="kpi-foot font-tamil">மொத்த ஊர்கள்</span>
                </div>

                {/* 4. Highest Single Gift */}
                <div className="kpi-card glass-card gold-kpi">
                    <div className="kpi-top">
                        <span className="kpi-title">Highest Single Gift</span>
                        <div className="kpi-icon-bg gold-icon"><Crown size={18} /></div>
                    </div>
                    <h2 className="kpi-value text-gold">
                        {highestTx ? `₹ ${Number(highestTx.amount).toLocaleString('en-IN')}` : '₹ 0'}
                    </h2>
                    <span className="kpi-foot text-truncate">
                        {highestTx ? `${highestTx.contributorName} (${highestTx.village || '-'})` : 'No entries yet'}
                    </span>
                </div>

                {/* 5. Gold Gifts Count */}
                <div className="kpi-card glass-card amber-kpi">
                    <div className="kpi-top">
                        <span className="kpi-title">Total Gold Gifts</span>
                        <div className="kpi-icon-bg amber-icon"><Coins size={18} /></div>
                    </div>
                    <h2 className="kpi-value text-gold">{goldEntries.length} Items</h2>
                    <span className="kpi-foot font-tamil">பொன்/நகை சேர்க்கைகள்</span>
                </div>

                {/* 6. Top Village Leader */}
                <div className="kpi-card glass-card rose-kpi">
                    <div className="kpi-top">
                        <span className="kpi-title">Top Village Leader</span>
                        <div className="kpi-icon-bg rose-icon"><MapPin size={18} /></div>
                    </div>
                    <h2 className="kpi-value text-truncate">{topVillageLeader.name}</h2>
                    <span className="kpi-foot">₹ {topVillageLeader.total.toLocaleString('en-IN')} Collection</span>
                </div>
            </div>

            {/* 📤 OUTBOUND GIFTS SUMMARY 📤 */}
            <div className="card-header-flex mb-3 mt-4">
                <div className="title-block">
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-header)', display: 'flex', alignItems: 'center', gap: '0.45rem', margin: 0 }}>
                        <TrendingUp size={16} className="text-gold" /> Given Gifts Summary (நாம் செய்த மொய் விபரம்)
                    </h3>
                </div>
            </div>

            {/* 📊 GIVEN MOI KPI GRID 📊 */}
            <div className="kpi-3-col-grid mb-4">
                {/* 1. Total Sent Amount */}
                <div className="kpi-card glass-card gold-kpi" style={{ cursor: 'pointer' }} onClick={() => onNavigate('given_moi')}>
                    <div className="kpi-top">
                        <span className="kpi-title">Total Amount Sent</span>
                        <div className="kpi-icon-bg gold-icon"><IndianRupee size={18} /></div>
                    </div>
                    <h2 className="kpi-value text-gold">₹ {totalGivenMoiAmount.toLocaleString('en-IN')}</h2>
                    <span className="kpi-foot font-tamil">நாம் செய்த மொத்த மொய்</span>
                </div>

                {/* 2. Total Sent Count */}
                <div className="kpi-card glass-card purple-kpi" style={{ cursor: 'pointer' }} onClick={() => onNavigate('given_moi')}>
                    <div className="kpi-top">
                        <span className="kpi-title">Total Gifts Sent</span>
                        <div className="kpi-icon-bg purple-icon"><Coins size={18} /></div>
                    </div>
                    <h2 className="kpi-value text-purple">{totalGivenMoiCount} Gifts</h2>
                    <span className="kpi-foot font-tamil">மொய் செய்த முறை</span>
                </div>

                {/* 3. Total Sent Villages */}
                <div className="kpi-card glass-card blue-kpi" style={{ cursor: 'pointer' }} onClick={() => onNavigate('given_moi')}>
                    <div className="kpi-top">
                        <span className="kpi-title">Total Villages Visited</span>
                        <div className="kpi-icon-bg blue-icon"><MapPin size={18} /></div>
                    </div>
                    <h2 className="kpi-value">{totalGivenMoiVillagesCount} Villages</h2>
                    <span className="kpi-foot font-tamil">மொய் செய்த ஊர்கள்</span>
                </div>
            </div>

            {/* 🌟 COMPACT 2x2 CHART ANALYTICS SUITE 🌟 */}
            <div className="charts-2x2-grid mb-4">
                {/* Chart 1: Collection Growth */}
                <div className="glass-chart-card">
                    <div className="chart-card-header">
                        <div className="chart-title">
                            <TrendingUp size={16} className="text-purple" />
                            <h3>Collection Growth Timeline (வளர்ச்சிப் பாதை)</h3>
                        </div>
                        <span className="chart-badge">Cumulative ₹</span>
                    </div>
                    <div className="chart-wrapper">
                        {timelineData.length === 0 ? (
                            <div className="empty-chart">No transaction data yet</div>
                        ) : (
                            <ResponsiveContainer width="100%" height={190}>
                                <AreaChart data={timelineData}>
                                    <defs>
                                        <linearGradient id="colorCumulative" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.5} />
                                            <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                                    <XAxis dataKey="index" stroke="#9CA3AF" tick={{ fontSize: 10 }} />
                                    <YAxis stroke="#9CA3AF" tick={{ fontSize: 10 }} tickFormatter={(v) => `₹${v / 1000}k`} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Area type="monotone" dataKey="cumulative" name="Total Collection" stroke="#8B5CF6" strokeWidth={2.5} fillOpacity={1} fill="url(#colorCumulative)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>

                {/* Chart 2: Top Village Contributions */}
                <div className="glass-chart-card">
                    <div className="chart-card-header">
                        <div className="chart-title">
                            <BarChart3 size={16} className="text-gold" />
                            <h3>Village Leaderboard Chart (ஊர் நிலவரம்)</h3>
                        </div>
                        <span className="chart-badge font-tamil">முக்கிய ஊர்கள்</span>
                    </div>
                    <div className="chart-wrapper">
                        {villageChartData.length === 0 ? (
                            <div className="empty-chart">No village data yet</div>
                        ) : (
                            <ResponsiveContainer width="100%" height={190}>
                                <BarChart data={villageChartData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                                    <XAxis dataKey="name" stroke="#9CA3AF" tick={{ fontSize: 10 }} />
                                    <YAxis stroke="#9CA3AF" tick={{ fontSize: 10 }} tickFormatter={(v) => `₹${v / 1000}k`} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Bar dataKey="total" name="Total ₹" fill="#F59E0B" radius={[6, 6, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>

                {/* Chart 3: Cash vs Gold Ratio */}
                <div className="glass-chart-card">
                    <div className="chart-card-header">
                        <div className="chart-title">
                            <PieIcon size={16} className="text-purple" />
                            <h3>Cash vs Gold Ratio (பணம் vs பொன்)</h3>
                        </div>
                        <span className="chart-badge">Split</span>
                    </div>
                    <div className="chart-wrapper flex-center">
                        {giftTypeData.length === 0 ? (
                            <div className="empty-chart">No gifts recorded yet</div>
                        ) : (
                            <ResponsiveContainer width="100%" height={190}>
                                <PieChart>
                                    <Pie
                                        data={giftTypeData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={50}
                                        outerRadius={75}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {giftTypeData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip content={<CustomTooltip />} />
                                </PieChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>

                {/* Chart 4: Gift Amount Tiers */}
                <div className="glass-chart-card">
                    <div className="chart-card-header">
                        <div className="chart-title">
                            <Activity size={16} className="text-emerald" />
                            <h3>Gift Price Slabs (தொகை வரம்பு)</h3>
                        </div>
                        <span className="chart-badge">Slabs</span>
                    </div>
                    <div className="chart-wrapper">
                        {transactions.length === 0 ? (
                            <div className="empty-chart">No transaction data</div>
                        ) : (
                            <ResponsiveContainer width="100%" height={190}>
                                <BarChart data={tierData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                                    <XAxis dataKey="tier" stroke="#9CA3AF" tick={{ fontSize: 10 }} />
                                    <YAxis stroke="#9CA3AF" tick={{ fontSize: 10 }} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Bar dataKey="count" name="Gifts Count" fill="#10B981" radius={[6, 6, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>
            </div>

            {/* 👑 COMPACT HIGHEST CONTRIBUTORS WALL OF FAME 👑 */}
            <div className="full-width-card glass-card mb-4">
                <div className="card-header-flex">
                    <div className="title-block">
                        <div className="badge-icon-purple">
                            <Sparkles size={18} className="text-gold" />
                        </div>
                        <div>
                            <h2>Highest Contributors Wall of Fame (உயர்ந்த மொய் வழங்கியோர்)</h2>
                            <p className="subtitle">Top 5 highest cash contributions for {event.name}</p>
                        </div>
                    </div>

                    <button className="btn-text" onClick={() => onNavigate('moi')}>
                        View All Entries <ArrowUpRight size={15} />
                    </button>
                </div>

                <div className="table-responsive mt-3">
                    <table className="custom-table modern-table compact-table">
                        <thead>
                            <tr>
                                <th>Rank</th>
                                <th>Name (பெயர்)</th>
                                <th>Village (ஊர்)</th>
                                <th>Amount (தொகை ₹)</th>
                                <th className="text-right">Receipt</th>
                            </tr>
                        </thead>
                        <tbody>
                            {topContributorsWall.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="text-center text-muted py-4">
                                        No cash entries recorded yet.
                                    </td>
                                </tr>
                            ) : (
                                topContributorsWall.map((tx, idx) => (
                                    <tr key={tx.transactionId} className="table-row-hover">
                                        <td>
                                            <span className={`rank-pill rank-${idx + 1}`}>
                                                {idx === 0 ? '👑 #1' : `#${idx + 1}`}
                                            </span>
                                        </td>
                                        <td className="font-semibold">{tx.contributorName}</td>
                                        <td><span className="badge-village">{tx.village || '-'}</span></td>
                                        <td className="amount-col">₹ {Number(tx.amount).toLocaleString('en-IN')}</td>
                                        <td className="text-right">
                                            <button
                                                className="action-btn btn-print"
                                                title="Print Receipt"
                                                onClick={() => setSelectedReceipt(tx)}
                                            >
                                                <Printer size={14} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Receipt Modal */}
            <ReceiptModal
                isOpen={!!selectedReceipt}
                onClose={() => setSelectedReceipt(null)}
                data={selectedReceipt}
                eventName={event.name}
            />
        </div>
    );
};
