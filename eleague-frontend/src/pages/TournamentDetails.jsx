import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    ArrowLeft,
    Calendar,
    CheckCircle2,
    Clock,
    Gamepad2,
    Loader2,
    Trophy,
    Users,
    XCircle,
    Shield,
    DollarSign,
    Swords,
    RefreshCw,
    ChevronRight,
    Crown,
    Medal,
    RotateCcw,
} from "lucide-react";

import api from "../services/api";
import { getUser, getPlayer } from "../services/auth";

function TournamentDetails() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [tournament, setTournament] = useState(null);
    const [players, setPlayers] = useState([]);
    const [matches, setMatches] = useState([]);
    const [champion, setChampion] = useState(null);

    const [standings, setStandings] = useState([]);
    const [groupStandings, setGroupStandings] = useState({});
    const [qualifiedGroups, setQualifiedGroups] = useState({});
    const [allGroupMatchesCompleted, setAllGroupMatchesCompleted] =
        useState(false);

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [qualificationLoading, setQualificationLoading] = useState(false);

    const [error, setError] = useState("");
    const [actionError, setActionError] = useState("");

    const [isRegistered, setIsRegistered] = useState(false);

    const user = getUser();
    const player = getPlayer();

    const isAdmin = user?.role === "admin";

    const isOrganizer =
        !!user &&
        !!tournament &&
        (
            tournament.organizer_id === user.id ||
            user.is_organizer === true ||
            user.role === "organizer"
        );

    const canManageTournament = isAdmin || isOrganizer;

    useEffect(() => {
        loadTournament();
    }, [id]);

    const loadTournament = async (showRefresh = false) => {
        try {
            if (showRefresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }

            setError("");

            const tournamentResponse = await api.get(
                `/tournaments/${id}`
            );

            const tournamentData = tournamentResponse.data;

            setTournament(tournamentData);

            const playersResponse = await api.get(
                `/tournaments/${id}/players`
            );

            const playersData =
                playersResponse.data?.players ??
                playersResponse.data ??
                [];

            const safePlayers = Array.isArray(playersData)
                ? playersData
                : [];

            setPlayers(safePlayers);

            const matchesResponse = await api.get(
                `/tournaments/${id}/matches`
            );

            const matchesData =
                matchesResponse.data?.matches ??
                matchesResponse.data ??
                [];

            const safeMatches = Array.isArray(matchesData)
                ? matchesData
                : [];

            const resolvedMatches = safeMatches.map((match) => ({
                ...match,

                player1:
                    match.player1 ??
                    findTournamentPlayer(
                        safePlayers,
                        match.player1_id
                    ),

                player2:
                    match.player2 ??
                    findTournamentPlayer(
                        safePlayers,
                        match.player2_id
                    ),

                winner:
                    match.winner ??
                    findTournamentPlayer(
                        safePlayers,
                        match.winner_id
                    ),
            }));

            setMatches(resolvedMatches);

            if (
                tournamentData.format === "round_robin" ||
                tournamentData.format === "group_knockout"
            ) {
                const standingsResponse = await api.get(
                    `/tournaments/${id}/standings`
                );

                const standingsData = standingsResponse.data;

                if (
                    tournamentData.format ===
                    "round_robin"
                ) {
                    setStandings(
                        standingsData?.standings ?? []
                    );

                    setGroupStandings({});
                    setQualifiedGroups({});
                    setAllGroupMatchesCompleted(false);
                }

                if (
                    tournamentData.format ===
                    "group_knockout"
                ) {
                    setStandings([]);

                    setGroupStandings(
                        standingsData?.groups ?? {}
                    );

                    setQualifiedGroups(
                        standingsData?.qualified ?? {}
                    );

                    setAllGroupMatchesCompleted(
                        Boolean(
                            standingsData?.all_group_matches_completed
                        )
                    );
                }
            } else {
                setStandings([]);
                setGroupStandings({});
                setQualifiedGroups({});
                setAllGroupMatchesCompleted(false);
            }

            if (
                tournamentData.status ===
                "completed"
            ) {
                try {
                    const championResponse =
                        await api.get(
                            `/tournaments/${id}/champion`
                        );

                    setChampion(
                        championResponse.data?.champion ??
                        championResponse.data ??
                        null
                    );
                } catch {
                    setChampion(null);
                }
            } else {
                setChampion(null);
            }

            setIsRegistered(
                safePlayers.some((item) => {
                    const playerId =
                        item.player_id ??
                        item.id ??
                        item.player?.id;

                    return (
                        playerId &&
                        player?.id &&
                        Number(playerId) ===
                            Number(player.id)
                    );
                })
            );
        } catch (err) {
            console.error(err);

            setError(
                err.response?.data?.message ||
                "Impossible de charger les informations du tournoi."
            );
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handlePublish = async () => {
        try {
            setActionLoading(true);
            setActionError("");

            await api.post(
                `/tournaments/${id}/publish`
            );

            await loadTournament(true);
        } catch (err) {
            console.error(err);

            setActionError(
                err.response?.data?.message ||
                "Impossible de publier le tournoi."
            );
        } finally {
            setActionLoading(false);
        }
    };

    const handleCancel = async () => {
        try {
            setActionLoading(true);
            setActionError("");

            await api.post(
                `/tournaments/${id}/cancel`
            );

            await loadTournament(true);
        } catch (err) {
            console.error(err);

            setActionError(
                err.response?.data?.message ||
                "Impossible d'annuler le tournoi."
            );
        } finally {
            setActionLoading(false);
        }
    };

    const handleJoin = async () => {
        if (!player?.id) {
            setActionError(
                "Vous devez avoir un profil joueur pour rejoindre ce tournoi."
            );

            return;
        }

        try {
            setActionLoading(true);
            setActionError("");

            await api.post(
                `/tournaments/${id}/register`
            );

            setIsRegistered(true);

            await loadTournament(true);
        } catch (err) {
            console.error(err);

            setActionError(
                err.response?.data?.message ||
                "Impossible de rejoindre le tournoi."
            );
        } finally {
            setActionLoading(false);
        }
    };

    const handleLeave = async () => {
        try {
            setActionLoading(true);
            setActionError("");

            await api.delete(
                `/tournaments/${id}/register`
            );

            setIsRegistered(false);

            await loadTournament(true);
        } catch (err) {
            console.error(err);

            setActionError(
                err.response?.data?.message ||
                "Impossible de quitter le tournoi."
            );
        } finally {
            setActionLoading(false);
        }
    };

    const handleQualifyGroups = async () => {
        try {
            setQualificationLoading(true);
            setActionError("");

            const response = await api.post(
                `/tournaments/${id}/groups/qualify`
            );

            setQualifiedGroups(
                response.data?.qualified ?? {}
            );

            await loadTournament(true);
        } catch (err) {
            console.error(err);

            setActionError(
                err.response?.data?.message ||
                "Impossible de qualifier les joueurs."
            );
        } finally {
            setQualificationLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
                <div className="flex items-center gap-3 text-slate-300">
                    <Loader2 className="w-6 h-6 animate-spin" />
                    Chargement du tournoi...
                </div>
            </div>
        );
    }

    if (error || !tournament) {
        return (
            <div className="min-h-screen bg-slate-950 text-white p-6">
                <button
                    onClick={() => navigate(-1)}
                    className="inline-flex items-center gap-2 text-slate-300 hover:text-white mb-8"
                >
                    <ArrowLeft className="w-5 h-5" />
                    Retour
                </button>

                <div className="max-w-3xl mx-auto rounded-2xl border border-red-500/20 bg-red-500/10 p-6">
                    <div className="flex items-center gap-3 text-red-400">
                        <XCircle className="w-6 h-6" />
                        <span>
                            {error ||
                                "Tournoi introuvable."}
                        </span>
                    </div>
                </div>
            </div>
        );
    }

    const groupMatches = matches.filter(
        (match) => Boolean(match.group)
    );

    const knockoutMatches = matches.filter(
        (match) => !match.group
    );

    const doubleEliminationMatches =
        tournament.format === "double_elimination"
            ? knockoutMatches
            : [];

    const status = tournament.status;

    const formatLabel = formatFormat(
        tournament.format
    );

    return (
        <div className="min-h-screen bg-slate-950 text-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

                <div className="flex items-center justify-between mb-6">
                    <button
                        onClick={() => navigate(-1)}
                        className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        Retour
                    </button>

                    <button
                        onClick={() =>
                            loadTournament(true)
                        }
                        disabled={refreshing}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-50 transition"
                    >
                        <RefreshCw
                            className={`w-4 h-4 ${
                                refreshing
                                    ? "animate-spin"
                                    : ""
                            }`}
                        />

                        Actualiser
                    </button>
                </div>

                <section className="relative overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 p-6 md:p-8 mb-8">
                    <div className="absolute inset-0 pointer-events-none bg-gradient-to-r from-indigo-500/10 via-transparent to-purple-500/10" />

                    <div className="relative">
                        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                            <div>
                                <div className="flex flex-wrap items-center gap-2 mb-4">
                                    <StatusBadge
                                        status={status}
                                    />

                                    <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800 text-slate-300 text-sm">
                                        <Swords className="w-4 h-4" />
                                        {formatLabel}
                                    </span>
                                </div>

                                <h1 className="text-3xl md:text-4xl font-bold mb-3">
                                    {tournament.name}
                                </h1>

                                {tournament.description && (
                                    <p className="max-w-3xl text-slate-400 leading-relaxed">
                                        {
                                            tournament.description
                                        }
                                    </p>
                                )}
                            </div>

                            {status ===
                                "completed" &&
                                champion && (
                                    <div className="shrink-0 rounded-2xl border border-yellow-500/20 bg-yellow-500/10 p-5 min-w-[230px]">
                                        <div className="flex items-center gap-2 text-yellow-400 mb-2">
                                            <Crown className="w-5 h-5" />

                                            <span className="font-semibold">
                                                Champion
                                            </span>
                                        </div>

                                        <div className="text-lg font-bold text-white">
                                            {champion.user
                                                ?.name ??
                                                champion.name ??
                                                champion.player_name ??
                                                "Champion"}
                                        </div>
                                    </div>
                                )}
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-8">
                            <StatBox
                                icon={
                                    <Gamepad2 className="w-5 h-5" />
                                }
                                label="Jeu"
                                value={
                                    tournament.game
                                        ?.name ??
                                    tournament.game_name ??
                                    "—"
                                }
                            />

                            <StatBox
                                icon={
                                    <Users className="w-5 h-5" />
                                }
                                label="Joueurs"
                                value={`${players.length}/${tournament.max_players ?? "—"}`}
                            />

                            <StatBox
                                icon={
                                    <Calendar className="w-5 h-5" />
                                }
                                label="Début"
                                value={formatDate(
                                    tournament.start_date
                                )}
                            />

                            <StatBox
                                icon={
                                    <DollarSign className="w-5 h-5" />
                                }
                                label="Prize"
                                value={
                                    tournament.prize !==
                                        null &&
                                    tournament.prize !==
                                        undefined
                                        ? tournament.prize
                                        : "—"
                                }
                            />
                        </div>
                    </div>
                </section>

                {actionError && (
                    <div className="mb-6 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-red-300">
                        <div className="flex items-start gap-3">
                            <XCircle className="w-5 h-5 mt-0.5 shrink-0" />

                            <span>
                                {actionError}
                            </span>
                        </div>
                    </div>
                )}

                {canManageTournament && (
                    <section className="mb-8 rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <div>
                                <h2 className="font-semibold">
                                    Gestion du tournoi
                                </h2>

                                <p className="text-sm text-slate-400 mt-1">
                                    Actions disponibles pour l'organisateur.
                                </p>
                            </div>

                            <div className="flex flex-wrap gap-3">
                                {status ===
                                    "draft" && (
                                    <button
                                        onClick={
                                            handlePublish
                                        }
                                        disabled={
                                            actionLoading
                                        }
                                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 transition"
                                    >
                                        {actionLoading ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <CheckCircle2 className="w-4 h-4" />
                                        )}

                                        Publier
                                    </button>
                                )}

                                {status !==
                                    "cancelled" &&
                                    status !==
                                        "completed" && (
                                    <button
                                        onClick={
                                            handleCancel
                                        }
                                        disabled={
                                            actionLoading
                                        }
                                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-600/90 hover:bg-red-500 disabled:opacity-50 transition"
                                    >
                                        <XCircle className="w-4 h-4" />
                                        Annuler
                                    </button>
                                )}
                            </div>
                        </div>
                    </section>
                )}

                {status !== "cancelled" &&
                    status !== "completed" &&
                    status !== "in_progress" && (
                        <section className="mb-8 rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-5">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                <div>
                                    <h2 className="font-semibold text-lg">
                                        Inscription
                                    </h2>

                                    <p className="text-sm text-slate-400 mt-1">
                                        {players.length >=
                                        tournament.max_players
                                            ? "Le tournoi est complet."
                                            : `${tournament.max_players - players.length} place(s) restante(s).`}
                                    </p>
                                </div>

                                {isRegistered ? (
                                    <button
                                        onClick={
                                            handleLeave
                                        }
                                        disabled={
                                            actionLoading
                                        }
                                        className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-50 transition"
                                    >
                                        {actionLoading && (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        )}

                                        Quitter le tournoi
                                    </button>
                                ) : (
                                    <button
                                        onClick={
                                            handleJoin
                                        }
                                        disabled={
                                            actionLoading ||
                                            players.length >=
                                                tournament.max_players
                                        }
                                        className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 transition"
                                    >
                                        {actionLoading && (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        )}

                                        Rejoindre le tournoi
                                    </button>
                                )}
                            </div>
                        </section>
                    )}

                {status === "draft" && (
                    <Notice
                        icon={
                            <Clock className="w-5 h-5" />
                        }
                        title="Tournoi en préparation"
                        text="Le tournoi n'est pas encore publié."
                    />
                )}

                {status === "in_progress" && (
                    <Notice
                        icon={
                            <Swords className="w-5 h-5" />
                        }
                        title="Tournoi en cours"
                        text="Les matchs sont actuellement en cours."
                    />
                )}

                {status === "cancelled" && (
                    <Notice
                        icon={
                            <XCircle className="w-5 h-5" />
                        }
                        title="Tournoi annulé"
                        text="Ce tournoi a été annulé."
                        danger
                    />
                )}

                {status === "completed" && (
                    <Notice
                        icon={
                            <Trophy className="w-5 h-5" />
                        }
                        title="Tournoi terminé"
                        text="Tous les matchs du tournoi sont terminés."
                        success
                    />
                )}

                <section className="mb-8">
                    <SectionTitle
                        icon={
                            <Users className="w-5 h-5" />
                        }
                        title="Joueurs inscrits"
                        count={players.length}
                    />

                    {players.length === 0 ? (
                        <EmptyState text="Aucun joueur inscrit pour le moment." />
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                            {players.map(
                                (item, index) => {
                                    const p =
                                        item.player ??
                                        item;

                                    const name =
                                        p.user?.name ??
                                        p.name ??
                                        item.user?.name ??
                                        `Player ${index + 1}`;

                                    return (
                                        <div
                                            key={
                                                p.id ??
                                                item.player_id ??
                                                index
                                            }
                                            className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center font-bold">
                                                    {name
                                                        .charAt(
                                                            0
                                                        )
                                                        .toUpperCase()}
                                                </div>

                                                <div className="min-w-0">
                                                    <div className="font-medium truncate">
                                                        {
                                                            name
                                                        }
                                                    </div>

                                                    {item
                                                        .pivot
                                                        ?.seed && (
                                                        <div className="text-xs text-slate-500">
                                                            Seed #
                                                            {
                                                                item
                                                                    .pivot
                                                                    .seed
                                                            }
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                }
                            )}
                        </div>
                    )}
                </section>

                {tournament.format ===
                    "group_knockout" && (
                    <>
                        <section className="mb-8">
                            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 mb-5">
                                <div>
                                    <SectionTitle
                                        icon={
                                            <Trophy className="w-5 h-5" />
                                        }
                                        title="Phase de groupes"
                                    />

                                    <p className="text-sm text-slate-400 mt-2">
                                        Les deux premiers joueurs de chaque groupe se qualifient pour la phase éliminatoire.
                                    </p>
                                </div>

                                {canManageTournament && (
                                    <button
                                        onClick={
                                            handleQualifyGroups
                                        }
                                        disabled={
                                            qualificationLoading ||
                                            !allGroupMatchesCompleted
                                        }
                                        className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed transition"
                                    >
                                        {qualificationLoading ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <ChevronRight className="w-4 h-4" />
                                        )}

                                        {allGroupMatchesCompleted
                                            ? "Qualifier les joueurs"
                                            : "Terminer les matchs d'abord"}
                                    </button>
                                )}
                            </div>

                            {!allGroupMatchesCompleted && (
                                <div className="mb-5 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-amber-300 text-sm">
                                    Tous les matchs de groupes doivent être terminés avant de pouvoir effectuer la qualification.
                                </div>
                            )}

                            {allGroupMatchesCompleted && (
                                <div className="mb-5 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-emerald-300 text-sm">
                                    Tous les matchs de groupes sont terminés. La qualification est disponible.
                                </div>
                            )}

                            {Object.keys(
                                groupStandings
                            ).length === 0 ? (
                                <EmptyState text="Les groupes ne sont pas encore disponibles." />
                            ) : (
                                <div className="space-y-8">
                                    {Object.entries(
                                        groupStandings
                                    ).map(
                                        ([
                                            groupName,
                                            groupPlayers,
                                        ]) => {
                                            const groupMatchesForGroup =
                                                groupMatches.filter(
                                                    (
                                                        match
                                                    ) =>
                                                        match.group ===
                                                        groupName
                                                );

                                            const qualified =
                                                qualifiedGroups?.[
                                                    groupName
                                                ];

                                            return (
                                                <GroupCard
                                                    key={
                                                        groupName
                                                    }
                                                    groupName={
                                                        groupName
                                                    }
                                                    standings={
                                                        groupPlayers
                                                    }
                                                    matches={
                                                        groupMatchesForGroup
                                                    }
                                                    qualified={
                                                        qualified
                                                    }
                                                />
                                            );
                                        }
                                    )}
                                </div>
                            )}
                        </section>

                        {knockoutMatches.length >
                            0 && (
                            <section className="mb-8">
                                <SectionTitle
                                    icon={
                                        <Swords className="w-5 h-5" />
                                    }
                                    title="Phase éliminatoire"
                                />

                                <KnockoutBracket
                                    matches={
                                        knockoutMatches
                                    }
                                />
                            </section>
                        )}
                    </>
                )}

                {tournament.format ===
                    "round_robin" &&
                    standings.length > 0 && (
                        <section className="mb-8">
                            <SectionTitle
                                icon={
                                    <Trophy className="w-5 h-5" />
                                }
                                title="Classement"
                            />

                            <StandingsTable
                                standings={
                                    standings
                                }
                            />

                            <div className="mt-8">
                                <SectionTitle
                                    icon={
                                        <Swords className="w-5 h-5" />
                                    }
                                    title="Matchs"
                                />

                                <div className="space-y-3">
                                    {matches.map(
                                        (match) => (
                                            <RoundRobinMatch
                                                key={
                                                    match.id
                                                }
                                                match={
                                                    match
                                                }
                                            />
                                        )
                                    )}
                                </div>
                            </div>
                        </section>
                    )}

                {tournament.format ===
                    "knockout" &&
                    knockoutMatches.length >
                        0 && (
                        <section className="mb-8">
                            <SectionTitle
                                icon={
                                    <Swords className="w-5 h-5" />
                                }
                                title="Bracket"
                            />

                            <KnockoutBracket
                                matches={
                                    knockoutMatches
                                }
                            />
                        </section>
                    )}

                {tournament.format ===
                    "double_elimination" &&
                    doubleEliminationMatches.length >
                        0 && (
                        <DoubleEliminationBracket
                            matches={
                                doubleEliminationMatches
                            }
                        />
                    )}

                {tournament.format !==
                    "group_knockout" &&
                    tournament.format !==
                        "round_robin" &&
                    tournament.format !==
                        "knockout" &&
                    tournament.format !==
                        "double_elimination" &&
                    matches.length > 0 && (
                        <section className="mb-8">
                            <SectionTitle
                                icon={
                                    <Swords className="w-5 h-5" />
                                }
                                title="Matchs"
                            />

                            <div className="space-y-3">
                                {matches.map(
                                    (match) => (
                                        <MatchRow
                                            key={
                                                match.id
                                            }
                                            match={
                                                match
                                            }
                                        />
                                    )
                                )}
                            </div>
                        </section>
                    )}

                {tournament.rules && (
                    <section className="mb-8">
                        <SectionTitle
                            icon={
                                <Shield className="w-5 h-5" />
                            }
                            title="Règlement"
                        />

                        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
                            <div className="whitespace-pre-wrap text-slate-300 leading-relaxed">
                                {
                                    tournament.rules
                                }
                            </div>
                        </div>
                    </section>
                )}
            </div>
        </div>
    );
}

/*
|--------------------------------------------------------------------------
| DOUBLE ELIMINATION
|--------------------------------------------------------------------------
*/

function DoubleEliminationBracket({
    matches,
}) {
    const winnersMatches = matches
        .filter(
            (match) =>
                match.bracket === "winners"
        )
        .sort(sortMatches);

    const losersMatches = matches
        .filter(
            (match) =>
                match.bracket === "losers"
        )
        .sort(sortMatches);

    const grandFinalMatches = matches
        .filter(
            (match) =>
                match.bracket === "grand_final"
        )
        .sort(sortMatches);

    const resetFinalMatches = matches
        .filter(
            (match) =>
                match.bracket ===
                "grand_final_reset"
        )
        .sort(sortMatches);

    const winnersRounds =
        groupMatchesByRound(winnersMatches);

    const losersRounds =
        groupMatchesByRound(losersMatches);

    return (
        <section className="mb-10 space-y-8">

            <div>
                <SectionTitle
                    icon={
                        <Swords className="w-5 h-5" />
                    }
                    title="Double Elimination"
                />

                <p className="text-sm text-slate-400 -mt-2">
                    Un joueur doit perdre deux matchs pour être éliminé.
                </p>
            </div>

            <DoubleBracketSection
                title="Winners Bracket"
                description="Les joueurs qui gagnent continuent dans le Winners Bracket. Les perdants descendent dans le Losers Bracket."
                icon={
                    <Trophy className="w-5 h-5" />
                }
                matches={winnersRounds}
                emptyText="Aucun match Winners disponible."
                variant="winners"
            />

            <DoubleBracketSection
                title="Losers Bracket"
                description="Une deuxième défaite élimine définitivement le joueur du tournoi."
                icon={
                    <RotateCcw className="w-5 h-5" />
                }
                matches={losersRounds}
                emptyText="Aucun match Losers disponible."
                variant="losers"
            />

            <DoubleFinalSection
                title="Grand Final"
                description="Le champion du Winners Bracket affronte le champion du Losers Bracket."
                matches={grandFinalMatches}
                icon={
                    <Crown className="w-5 h-5" />
                }
            />

            {resetFinalMatches.length >
                0 && (
                <DoubleFinalSection
                    title="Grand Final Reset"
                    description="Cette finale supplémentaire ne devient active que si le champion du Losers Bracket remporte la première Grand Final."
                    matches={
                        resetFinalMatches
                    }
                    icon={
                        <RefreshCw className="w-5 h-5" />
                    }
                    reset
                />
            )}
        </section>
    );
}

function DoubleBracketSection({
    title,
    description,
    icon,
    matches,
    emptyText,
    variant,
}) {
    const isLosers =
        variant === "losers";

    return (
        <div className="rounded-3xl border border-slate-800 bg-slate-900/60 overflow-hidden">
            <div
                className={`p-5 border-b border-slate-800 ${
                    isLosers
                        ? "bg-red-500/[0.03]"
                        : "bg-emerald-500/[0.03]"
                }`}
            >
                <div className="flex items-start gap-3">
                    <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                            isLosers
                                ? "bg-red-500/10 text-red-400"
                                : "bg-emerald-500/10 text-emerald-400"
                        }`}
                    >
                        {icon}
                    </div>

                    <div>
                        <h3 className="text-xl font-bold">
                            {title}
                        </h3>

                        <p className="text-sm text-slate-400 mt-1 max-w-3xl">
                            {description}
                        </p>
                    </div>
                </div>
            </div>

            {matches.length === 0 ? (
                <div className="p-6">
                    <EmptyState
                        text={emptyText}
                    />
                </div>
            ) : (
                <div className="p-5 overflow-x-auto">
                    <div className="flex items-start gap-8 min-w-max">
                        {matches.map(
                            (round) => (
                                <DoubleBracketRound
                                    key={
                                        round.round
                                    }
                                    round={
                                        round
                                    }
                                    variant={
                                        variant
                                    }
                                />
                            )
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

function DoubleBracketRound({
    round,
    variant,
}) {
    const isLosers =
        variant === "losers";

    return (
        <div className="w-[270px] shrink-0">
            <div className="mb-4">
                <div className="flex items-center gap-2">
                    <span
                        className={`w-2 h-2 rounded-full ${
                            isLosers
                                ? "bg-red-400"
                                : "bg-emerald-400"
                        }`}
                    />

                    <h4 className="font-bold">
                        {getDoubleRoundName(
                            round.round,
                            variant
                        )}
                    </h4>
                </div>

                <p className="text-xs text-slate-500 mt-1">
                    Round {round.round}
                </p>
            </div>

            <div className="space-y-5">
                {round.matches.map(
                    (match) => (
                        <BracketMatch
                            key={match.id}
                            match={match}
                        />
                    )
                )}
            </div>
        </div>
    );
}

/*
|--------------------------------------------------------------------------
| GRAND FINAL / RESET FINAL
|--------------------------------------------------------------------------
*/

function DoubleFinalSection({
    title,
    description,
    matches,
    icon,
    reset = false,
}) {
    return (
        <div
            className={`rounded-3xl border overflow-hidden ${
                reset
                    ? "border-purple-500/20 bg-purple-500/[0.03]"
                    : "border-yellow-500/20 bg-yellow-500/[0.03]"
            }`}
        >
            <div className="p-5 border-b border-slate-800">
                <div className="flex items-start gap-3">
                    <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                            reset
                                ? "bg-purple-500/10 text-purple-400"
                                : "bg-yellow-500/10 text-yellow-400"
                        }`}
                    >
                        {icon}
                    </div>

                    <div>
                        <h3 className="text-xl font-bold">
                            {title}
                        </h3>

                        <p className="text-sm text-slate-400 mt-1 max-w-3xl">
                            {description}
                        </p>
                    </div>
                </div>
            </div>

            <div className="p-5">
                {matches.length === 0 ? (
                    <EmptyState
                        text="La finale n'est pas encore disponible."
                    />
                ) : (
                    <div className="max-w-xl">
                        {matches.map(
                            (match) => (
                                <FinalMatchCard
                                    key={
                                        match.id
                                    }
                                    match={
                                        match
                                    }
                                    reset={
                                        reset
                                    }
                                />
                            )
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

function FinalMatchCard({
    match,
    reset,
}) {
    /*
    |--------------------------------------------------------------------------
    | IMPORTANT
    |--------------------------------------------------------------------------
    | Reset Final starts as "pending".
    | It is NOT a real playable match yet.
    |
    | Only after Losers Champion wins the first
    | Grand Final does backend set:
    |
    | status = scheduled
    | player1_id = Winners Champion
    | player2_id = Losers Champion
    |
    */

    const isPendingReset =
        reset &&
        (
            match.status === "pending" ||
            !match.player1_id ||
            !match.player2_id
        );

    const isCancelledReset =
        reset &&
        match.status === "cancelled";

    if (isPendingReset) {
        return (
            <div className="rounded-3xl border border-purple-500/20 bg-slate-950 overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <RefreshCw className="w-4 h-4 text-purple-400" />

                        <span className="font-semibold">
                            Grand Final Reset
                        </span>
                    </div>

                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800 text-slate-400 text-xs">
                        <Clock className="w-3.5 h-3.5" />
                        En attente
                    </span>
                </div>

                <div className="p-6">
                    <div className="flex flex-col items-center text-center">
                        <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-400 flex items-center justify-center mb-4">
                            <RotateCcw className="w-6 h-6" />
                        </div>

                        <h4 className="font-bold text-white mb-2">
                            Reset Final non activée
                        </h4>

                        <p className="text-sm text-slate-400 max-w-md leading-relaxed">
                            Cette finale sera activée uniquement si le champion du Losers Bracket remporte la première Grand Final.
                        </p>

                        <div className="mt-4 inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-purple-500/5 border border-purple-500/10 text-purple-300 text-xs">
                            <Shield className="w-4 h-4" />
                            Match conditionnel
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (isCancelledReset) {
        return (
            <div className="rounded-3xl border border-slate-800 bg-slate-950 overflow-hidden opacity-70">
                <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <RefreshCw className="w-4 h-4 text-slate-500" />

                        <span className="font-semibold">
                            Grand Final Reset
                        </span>
                    </div>

                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800 text-slate-500 text-xs">
                        <XCircle className="w-3.5 h-3.5" />
                        Non nécessaire
                    </span>
                </div>

                <div className="p-6 text-center">
                    <p className="text-sm text-slate-500">
                        Le champion du Winners Bracket a remporté la Grand Final. Le Reset Final n'était donc pas nécessaire.
                    </p>
                </div>
            </div>
        );
    }

    const player1 =
        getPlayerName(
            match.player1
        ) ?? "À déterminer";

    const player2 =
        getPlayerName(
            match.player2
        ) ?? "À déterminer";

    const score1 = getScore(
        match.player1_score
    );

    const score2 = getScore(
        match.player2_score
    );

    const player1Winner =
        match.winner_id &&
        Number(match.winner_id) ===
            Number(match.player1_id);

    const player2Winner =
        match.winner_id &&
        Number(match.winner_id) ===
            Number(match.player2_id);

    return (
        <div
            className={`rounded-3xl border overflow-hidden ${
                reset
                    ? "border-purple-500/30 bg-slate-950"
                    : "border-yellow-500/30 bg-slate-950"
            }`}
        >
            <div className="px-5 py-3 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    {reset ? (
                        <RefreshCw className="w-4 h-4 text-purple-400" />
                    ) : (
                        <Crown className="w-4 h-4 text-yellow-400" />
                    )}

                    <span className="font-semibold">
                        {reset
                            ? "Grand Final Reset"
                            : "Grand Final"}
                    </span>
                </div>

                <span className="text-xs text-slate-500">
                    {getMatchStatus(
                        match.status
                    )}
                </span>
            </div>

            <BracketPlayer
                name={player1}
                score={score1}
                winner={player1Winner}
            />

            <div className="h-px bg-slate-800" />

            <BracketPlayer
                name={player2}
                score={score2}
                winner={player2Winner}
            />

            {match.scheduled_at && (
                <div className="px-5 py-3 border-t border-slate-800 text-xs text-slate-500">
                    {formatDate(
                        match.scheduled_at
                    )}
                </div>
            )}
        </div>
    );
}

function BracketPlayer({
    name,
    score,
    winner,
}) {
    return (
        <div
            className={`px-3 py-3 flex items-center justify-between gap-3 ${
                winner
                    ? "bg-emerald-500/10"
                    : ""
            }`}
        >
            <div className="flex items-center gap-2 min-w-0">
                {winner && (
                    <Crown className="w-4 h-4 text-emerald-400 shrink-0" />
                )}

                <span
                    className={`truncate text-sm ${
                        winner
                            ? "text-emerald-300 font-semibold"
                            : "text-slate-300"
                    }`}
                >
                    {name}
                </span>
            </div>

            <span className="font-bold text-white">
                {score}
            </span>
        </div>
    );
}

/*
|--------------------------------------------------------------------------
| GROUP STAGE
|--------------------------------------------------------------------------
*/

function GroupCard({
    groupName,
    standings,
    matches,
    qualified,
}) {
    return (
        <div className="rounded-3xl border border-slate-800 bg-slate-900/70 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold">
                            {groupName.replace(
                                "Group ",
                                ""
                            )}
                        </div>

                        <div>
                            <h3 className="font-bold text-lg">
                                {groupName}
                            </h3>

                            <p className="text-xs text-slate-500">
                                {
                                    standings.length
                                }{" "}
                                joueurs
                            </p>
                        </div>
                    </div>
                </div>

                {qualified && (
                    <div className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-500/10 text-emerald-400 text-sm">
                        <CheckCircle2 className="w-4 h-4" />
                        Qualification disponible
                    </div>
                )}
            </div>

            <div className="overflow-x-auto">
                <table className="w-full min-w-[700px]">
                    <thead>
                        <tr className="text-left text-xs text-slate-500 uppercase border-b border-slate-800">
                            <th className="px-4 py-3 w-12">
                                #
                            </th>

                            <th className="px-4 py-3">
                                Joueur
                            </th>

                            <th className="px-3 py-3 text-center">
                                MJ
                            </th>

                            <th className="px-3 py-3 text-center">
                                V
                            </th>

                            <th className="px-3 py-3 text-center">
                                N
                            </th>

                            <th className="px-3 py-3 text-center">
                                D
                            </th>

                            <th className="px-3 py-3 text-center">
                                BP
                            </th>

                            <th className="px-3 py-3 text-center">
                                BC
                            </th>

                            <th className="px-3 py-3 text-center">
                                Diff
                            </th>

                            <th className="px-4 py-3 text-center">
                                PTS
                            </th>
                        </tr>
                    </thead>

                    <tbody>
                        {standings.map(
                            (row, index) => {
                                const isQualified =
                                    index < 2;

                                return (
                                    <tr
                                        key={
                                            row.player_id
                                        }
                                        className={`border-b border-slate-800/70 ${
                                            isQualified
                                                ? "bg-emerald-500/[0.04]"
                                                : ""
                                        }`}
                                    >
                                        <td className="px-4 py-4">
                                            {isQualified ? (
                                                <Medal className="w-4 h-4 text-emerald-400" />
                                            ) : (
                                                <span className="text-slate-500">
                                                    {row.position ??
                                                        index +
                                                            1}
                                                </span>
                                            )}
                                        </td>

                                        <td className="px-4 py-4">
                                            <div className="font-medium text-white">
                                                {
                                                    row.player_name
                                                }
                                            </div>

                                            {isQualified && (
                                                <div className="text-xs text-emerald-400 mt-0.5">
                                                    Qualifié
                                                </div>
                                            )}
                                        </td>

                                        <td className="px-3 py-4 text-center text-slate-300">
                                            {
                                                row.played
                                            }
                                        </td>

                                        <td className="px-3 py-4 text-center text-slate-300">
                                            {
                                                row.wins
                                            }
                                        </td>

                                        <td className="px-3 py-4 text-center text-slate-300">
                                            {
                                                row.draws
                                            }
                                        </td>

                                        <td className="px-3 py-4 text-center text-slate-300">
                                            {
                                                row.losses
                                            }
                                        </td>

                                        <td className="px-3 py-4 text-center text-slate-300">
                                            {
                                                row.goals_for
                                            }
                                        </td>

                                        <td className="px-3 py-4 text-center text-slate-300">
                                            {
                                                row.goals_against
                                            }
                                        </td>

                                        <td className="px-3 py-4 text-center">
                                            {row.goal_difference >
                                            0
                                                ? `+${row.goal_difference}`
                                                : row.goal_difference}
                                        </td>

                                        <td className="px-4 py-4 text-center">
                                            <span className="font-bold text-white">
                                                {
                                                    row.points
                                                }
                                            </span>
                                        </td>
                                    </tr>
                                );
                            }
                        )}
                    </tbody>
                </table>
            </div>

            <div className="border-t border-slate-800 p-5">
                <div className="flex items-center gap-2 mb-4">
                    <Swords className="w-4 h-4 text-slate-400" />

                    <h4 className="font-semibold">
                        Matchs — {groupName}
                    </h4>
                </div>

                {matches.length ===
                0 ? (
                    <div className="text-sm text-slate-500">
                        Aucun match.
                    </div>
                ) : (
                    <div className="space-y-3">
                        {matches.map(
                            (match) => (
                                <MatchRow
                                    key={
                                        match.id
                                    }
                                    match={
                                        match
                                    }
                                />
                            )
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

/*
|--------------------------------------------------------------------------
| STANDINGS
|--------------------------------------------------------------------------
*/

function StandingsTable({
    standings,
}) {
    return (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 overflow-x-auto">
            <table className="w-full min-w-[700px]">
                <thead>
                    <tr className="text-left text-xs text-slate-500 uppercase border-b border-slate-800">
                        <th className="px-4 py-3">
                            #
                        </th>

                        <th className="px-4 py-3">
                            Joueur
                        </th>

                        <th className="px-3 py-3 text-center">
                            MJ
                        </th>

                        <th className="px-3 py-3 text-center">
                            V
                        </th>

                        <th className="px-3 py-3 text-center">
                            N
                        </th>

                        <th className="px-3 py-3 text-center">
                            D
                        </th>

                        <th className="px-3 py-3 text-center">
                            BP
                        </th>

                        <th className="px-3 py-3 text-center">
                            BC
                        </th>

                        <th className="px-3 py-3 text-center">
                            Diff
                        </th>

                        <th className="px-4 py-3 text-center">
                            PTS
                        </th>
                    </tr>
                </thead>

                <tbody>
                    {standings.map(
                        (row, index) => (
                            <tr
                                key={
                                    row.player_id
                                }
                                className="border-b border-slate-800/70"
                            >
                                <td className="px-4 py-4 text-slate-500">
                                    {row.position ??
                                        index + 1}
                                </td>

                                <td className="px-4 py-4 font-medium">
                                    {
                                        row.player_name
                                    }
                                </td>

                                <td className="px-3 py-4 text-center">
                                    {
                                        row.played
                                    }
                                </td>

                                <td className="px-3 py-4 text-center">
                                    {row.wins}
                                </td>

                                <td className="px-3 py-4 text-center">
                                    {row.draws}
                                </td>

                                <td className="px-3 py-4 text-center">
                                    {
                                        row.losses
                                    }
                                </td>

                                <td className="px-3 py-4 text-center">
                                    {
                                        row.goals_for
                                    }
                                </td>

                                <td className="px-3 py-4 text-center">
                                    {
                                        row.goals_against
                                    }
                                </td>

                                <td className="px-3 py-4 text-center">
                                    {row.goal_difference >
                                    0
                                        ? `+${row.goal_difference}`
                                        : row.goal_difference}
                                </td>

                                <td className="px-4 py-4 text-center font-bold">
                                    {
                                        row.points
                                    }
                                </td>
                            </tr>
                        )
                    )}
                </tbody>
            </table>
        </div>
    );
}

/*
|--------------------------------------------------------------------------
| KNOCKOUT
|--------------------------------------------------------------------------
*/

function KnockoutBracket({
    matches,
}) {
    const rounds =
        groupMatchesByRound(matches);

    if (rounds.length === 0) {
        return (
            <EmptyState text="Aucun match éliminatoire disponible." />
        );
    }

    return (
        <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5 overflow-x-auto">
            <div className="flex items-stretch gap-8 min-w-max">
                {rounds.map(
                    (round, index) => (
                        <BracketRound
                            key={
                                round.round
                            }
                            round={round}
                            roundIndex={
                                index
                            }
                            totalRounds={
                                rounds.length
                            }
                        />
                    )
                )}
            </div>
        </div>
    );
}

function BracketRound({
    round,
    roundIndex,
    totalRounds,
}) {
    return (
        <div className="w-[260px] shrink-0">
            <div className="mb-4">
                <h3 className="font-bold">
                    {getKnockoutRoundName(
                        roundIndex,
                        totalRounds
                    )}
                </h3>

                <p className="text-xs text-slate-500 mt-1">
                    Round {round.round}
                </p>
            </div>

            <div className="space-y-4">
                {round.matches.map(
                    (match) => (
                        <BracketMatch
                            key={
                                match.id
                            }
                            match={
                                match
                            }
                        />
                    )
                )}
            </div>
        </div>
    );
}

function BracketMatch({
    match,
}) {
    const player1 =
        getPlayerName(
            match.player1
        ) ?? "À déterminer";

    const player2 =
        getPlayerName(
            match.player2
        ) ?? "À déterminer";

    const score1 = getScore(
        match.player1_score
    );

    const score2 = getScore(
        match.player2_score
    );

    return (
        <div className="rounded-2xl border border-slate-800 bg-slate-950/80 overflow-hidden">
            <BracketPlayer
                name={player1}
                score={score1}
                winner={
                    match.winner_id &&
                    Number(
                        match.winner_id
                    ) ===
                        Number(
                            match.player1_id
                        )
                }
            />

            <div className="h-px bg-slate-800" />

            <BracketPlayer
                name={player2}
                score={score2}
                winner={
                    match.winner_id &&
                    Number(
                        match.winner_id
                    ) ===
                        Number(
                            match.player2_id
                        )
                }
            />

            <div className="px-3 py-2 border-t border-slate-800 text-xs text-slate-500 flex items-center justify-between gap-3">
                <span>
                    {getMatchStatus(
                        match.status
                    )}
                </span>

                {match.scheduled_at && (
                    <span>
                        {formatDate(
                            match.scheduled_at
                        )}
                    </span>
                )}
            </div>
        </div>
    );
}

/*
|--------------------------------------------------------------------------
| ROUND ROBIN
|--------------------------------------------------------------------------
*/

function RoundRobinMatch({
    match,
}) {
    return (
        <MatchRow
            match={match}
        />
    );
}

function MatchRow({
    match,
}) {
    const player1 =
        getPlayerName(
            match.player1
        ) ?? "À déterminer";

    const player2 =
        getPlayerName(
            match.player2
        ) ?? "À déterminer";

    const score1 = getScore(
        match.player1_score
    );

    const score2 = getScore(
        match.player2_score
    );

    return (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
            <div className="flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0 text-right">
                    <span className="font-medium text-slate-200 truncate block">
                        {player1}
                    </span>
                </div>

                <div className="shrink-0 min-w-[80px] text-center">
                    <div className="font-bold text-lg">
                        {score1}

                        <span className="text-slate-600 mx-1">
                            -
                        </span>

                        {score2}
                    </div>

                    <div className="text-xs text-slate-500 mt-1">
                        {getMatchStatus(
                            match.status
                        )}
                    </div>
                </div>

                <div className="flex-1 min-w-0">
                    <span className="font-medium text-slate-200 truncate block">
                        {player2}
                    </span>
                </div>
            </div>
        </div>
    );
}

/*
|--------------------------------------------------------------------------
| SHARED UI
|--------------------------------------------------------------------------
*/

function SectionTitle({
    icon,
    title,
    count,
}) {
    return (
        <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-indigo-400">
                {icon}
            </div>

            <div>
                <h2 className="text-xl font-bold">
                    {title}

                    {count !==
                        undefined && (
                        <span className="ml-2 text-sm font-normal text-slate-500">
                            ({count})
                        </span>
                    )}
                </h2>
            </div>
        </div>
    );
}

function StatBox({
    icon,
    label,
    value,
}) {
    return (
        <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
            <div className="flex items-center gap-2 text-slate-500 text-sm mb-2">
                {icon}
                <span>{label}</span>
            </div>

            <div className="font-semibold text-white truncate">
                {value}
            </div>
        </div>
    );
}

function Notice({
    icon,
    title,
    text,
    danger = false,
    success = false,
}) {
    const classes = danger
        ? "border-red-500/20 bg-red-500/10 text-red-300"
        : success
            ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
            : "border-slate-800 bg-slate-900/60 text-slate-300";

    return (
        <div
            className={`mb-8 rounded-2xl border p-5 ${classes}`}
        >
            <div className="flex items-start gap-3">
                <div className="mt-0.5">
                    {icon}
                </div>

                <div>
                    <div className="font-semibold">
                        {title}
                    </div>

                    <div className="text-sm opacity-80 mt-1">
                        {text}
                    </div>
                </div>
            </div>
        </div>
    );
}

function EmptyState({
    text,
}) {
    return (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-8 text-center text-slate-500">
            {text}
        </div>
    );
}

function StatusBadge({
    status,
}) {
    const config = {
        draft: {
            label: "Draft",
            className:
                "bg-slate-700/60 text-slate-300",
        },

        published: {
            label: "Publié",
            className:
                "bg-blue-500/10 text-blue-400",
        },

        in_progress: {
            label: "En cours",
            className:
                "bg-amber-500/10 text-amber-400",
        },

        completed: {
            label: "Terminé",
            className:
                "bg-emerald-500/10 text-emerald-400",
        },

        cancelled: {
            label: "Annulé",
            className:
                "bg-red-500/10 text-red-400",
        },
    };

    const current =
        config[status] ?? {
            label:
                status ??
                "Unknown",

            className:
                "bg-slate-700/60 text-slate-300",
        };

    return (
        <span
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm ${current.className}`}
        >
            {status ===
            "completed" ? (
                <CheckCircle2 className="w-4 h-4" />
            ) : status ===
              "cancelled" ? (
                <XCircle className="w-4 h-4" />
            ) : status ===
              "in_progress" ? (
                <Swords className="w-4 h-4" />
            ) : (
                <Clock className="w-4 h-4" />
            )}

            {current.label}
        </span>
    );
}

/*
|--------------------------------------------------------------------------
| HELPERS
|--------------------------------------------------------------------------
*/

function findTournamentPlayer(
    players,
    playerId
) {
    if (
        playerId === null ||
        playerId === undefined ||
        playerId === ""
    ) {
        return null;
    }

    const numericId =
        Number(playerId);

    const item = players.find(
        (entry) => {
            const player =
                entry?.player ??
                entry;

            const id =
                player?.id ??
                entry?.player_id ??
                null;

            return (
                id !== null &&
                id !== undefined &&
                Number(id) ===
                    numericId
            );
        }
    );

    if (!item) {
        return null;
    }

    return (
        item.player ??
        item
    );
}

function getPlayerName(
    player
) {
    if (!player) {
        return null;
    }

    return (
        player.user?.name ??
        player.name ??
        player.player_name ??
        null
    );
}

function getScore(score) {
    if (
        score === null ||
        score === undefined
    ) {
        return "-";
    }

    return score;
}

function sortMatches(a, b) {
    const roundA =
        Number(a.round) || 0;

    const roundB =
        Number(b.round) || 0;

    if (roundA !== roundB) {
        return roundA - roundB;
    }

    return (
        Number(a.id) -
        Number(b.id)
    );
}

function groupMatchesByRound(
    matches
) {
    const map = new Map();

    matches.forEach(
        (match) => {
            const round =
                Number(
                    match.round
                );

            if (!map.has(round)) {
                map.set(
                    round,
                    []
                );
            }

            map.get(round).push(
                match
            );
        }
    );

    return Array.from(
        map.entries()
    )
        .sort(
            ([a], [b]) =>
                a - b
        )
        .map(
            ([
                round,
                roundMatches,
            ]) => ({
                round,
                matches:
                    roundMatches.sort(
                        (
                            a,
                            b
                        ) =>
                            Number(
                                a.id
                            ) -
                            Number(
                                b.id
                            )
                    ),
            })
        );
}

function getDoubleRoundName(
    round,
    variant
) {
    if (variant === "winners") {
        return `Winners Round ${round}`;
    }

    return `Losers Round ${round}`;
}

function formatFormat(
    format
) {
    switch (format) {
        case "knockout":
            return "Knockout";

        case "round_robin":
            return "Round Robin";

        case "group_knockout":
            return "Group Stage → Knockout";

        case "double_elimination":
            return "Double Elimination";

        default:
            return format ?? "—";
    }
}

function getKnockoutRoundName(
    roundIndex,
    totalRounds
) {
    const distance =
        totalRounds -
        roundIndex -
        1;

    if (distance === 0) {
        return "Finale";
    }

    if (distance === 1) {
        return "Demi-finales";
    }

    if (distance === 2) {
        return "Quarts de finale";
    }

    if (distance === 3) {
        return "Huitièmes de finale";
    }

    if (distance === 4) {
        return "Seizièmes de finale";
    }

    return `Tour ${
        roundIndex + 1
    }`;
}

function getMatchStatus(
    status
) {
    switch (status) {
        case "scheduled":
            return "Programmé";

        case "in_progress":
            return "En cours";

        case "completed":
            return "Terminé";

        case "pending":
            return "En attente";

        case "cancelled":
            return "Non nécessaire";

        default:
            return status ?? "—";
    }
}

function formatDate(date) {
    if (!date) {
        return "—";
    }

    try {
        const value =
            String(date).trim();

        const match =
            value.match(
                /^(\d{4})-(\d{2})-(\d{2})[T\s](\d{2}):(\d{2})(?::(\d{2}))?/
            );

        if (!match) {
            return "—";
        }

        const [
            ,
            year,
            month,
            day,
            hour,
            minute,
        ] = match;

        return new Intl.DateTimeFormat(
            "fr-FR",
            {
                dateStyle:
                    "medium",
                timeStyle:
                    "short",
            }
        ).format(
            new Date(
                Number(year),
                Number(month) -
                    1,
                Number(day),
                Number(hour),
                Number(minute)
            )
        );
    } catch {
        return "—";
    }
}

export default TournamentDetails;