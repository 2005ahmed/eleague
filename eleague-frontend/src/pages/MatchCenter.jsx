import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    ArrowLeft,
    Calendar,
    CheckCircle2,
    Clock,
    Crown,
    Gamepad2,
    Image as ImageIcon,
    Loader2,
    RefreshCw,
    Shield,
    Swords,
    Trophy,
    Upload,
    Users,
    XCircle,
} from "lucide-react";

import api from "../services/api";
import { getPlayer } from "../services/auth";

function MatchCenter() {
    const { tournamentId, matchId } = useParams();
    const navigate = useNavigate();

    const player = getPlayer();

    const [tournament, setTournament] =
        useState(null);

    const [match, setMatch] =
        useState(null);

    const [loading, setLoading] =
        useState(true);

    const [refreshing, setRefreshing] =
        useState(false);

    const [submitting, setSubmitting] =
        useState(false);

    const [error, setError] =
        useState("");

    const [success, setSuccess] =
        useState("");

    const [player1Score, setPlayer1Score] =
        useState("");

    const [player2Score, setPlayer2Score] =
        useState("");

    const [screenshot, setScreenshot] =
        useState(null);

    const [screenshotPreview, setScreenshotPreview] =
        useState("");

    useEffect(() => {
        loadMatch();
    }, [tournamentId, matchId]);

    const loadMatch = async (
        showRefresh = false
    ) => {
        try {
            if (showRefresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }

            setError("");
            setSuccess("");

            /*
            |--------------------------------------------------------------------------
            | Tournament
            |--------------------------------------------------------------------------
            */

            const tournamentResponse =
                await api.get(
                    `/tournaments/${tournamentId}`
                );

            const tournamentData =
                tournamentResponse.data;

            setTournament(
                tournamentData
            );

            /*
            |--------------------------------------------------------------------------
            | Matches
            |--------------------------------------------------------------------------
            |
            | We already have this endpoint:
            |
            | GET /tournaments/{tournament}/matches
            |
            | So we don't need another backend endpoint
            | just to display the Match Center.
            |
            */

            const matchesResponse =
                await api.get(
                    `/tournaments/${tournamentId}/matches`
                );

            const matchesData =
                matchesResponse.data?.matches ??
                matchesResponse.data ??
                [];

            const safeMatches =
                Array.isArray(matchesData)
                    ? matchesData
                    : [];

            const currentMatch =
                safeMatches.find(
                    (item) =>
                        Number(item.id) ===
                        Number(matchId)
                );

            if (!currentMatch) {
                setError(
                    "Match introuvable."
                );

                setMatch(null);

                return;
            }

            setMatch(
                currentMatch
            );

            /*
            |--------------------------------------------------------------------------
            | Fill existing score only if match is completed
            |--------------------------------------------------------------------------
            */

            if (
                currentMatch.status ===
                "completed"
            ) {
                setPlayer1Score(
                    currentMatch.player1_score ??
                        ""
                );

                setPlayer2Score(
                    currentMatch.player2_score ??
                        ""
                );
            }
        } catch (err) {
            console.error(err);

            setError(
                err.response?.data?.message ||
                    "Impossible de charger le match."
            );
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const player1 =
        match?.player1 ??
        null;

    const player2 =
        match?.player2 ??
        null;

    const player1Name =
        getPlayerName(
            player1
        );

    const player2Name =
        getPlayerName(
            player2
        );

    const currentPlayerIsPlayer1 =
        Boolean(
            player?.id &&
                match?.player1_id &&
                Number(player.id) ===
                    Number(match.player1_id)
        );

    const currentPlayerIsPlayer2 =
        Boolean(
            player?.id &&
                match?.player2_id &&
                Number(player.id) ===
                    Number(match.player2_id)
        );

    const currentPlayerName =
        currentPlayerIsPlayer1
            ? player1Name
            : currentPlayerIsPlayer2
                ? player2Name
                : "Vous";

    const opponentName =
        currentPlayerIsPlayer1
            ? player2Name
            : currentPlayerIsPlayer2
                ? player1Name
                : "Adversaire";

    const canSubmit =
        match?.status === "scheduled" &&
        currentPlayerIsPlayer1 ||
        match?.status === "scheduled" &&
        currentPlayerIsPlayer2;

    const hasPendingResult =
        match?.results?.some(
            (result) =>
                result.verified === false
        ) ?? false;

    const matchWinnerName =
        match?.winner
            ? getPlayerName(
                  match.winner
              )
            : match?.winner_id
                ? Number(
                      match.winner_id
                  ) ===
                  Number(
                      match.player1_id
                  )
                    ? player1Name
                    : player2Name
                : null;

    const isWinner =
        Boolean(
            match?.winner_id &&
                player?.id
        ) &&
        Number(match.winner_id) ===
            Number(player.id);

    const isLoser =
        Boolean(
            match?.winner_id &&
                player?.id
        ) &&
        Number(match.winner_id) !==
            Number(player.id);

    const bracketLabel =
        getBracketLabel(
            match?.bracket
        );

    const roundLabel =
        getRoundLabel(
            match
        );

    const statusInfo =
        getStatusInfo(
            match?.status
        );

    const player1ScoreNumber =
        player1Score === ""
            ? null
            : Number(
                  player1Score
              );

    const player2ScoreNumber =
        player2Score === ""
            ? null
            : Number(
                  player2Score
              );

    const scoreError =
        player1Score !== "" &&
        player2Score !== "" &&
        !Number.isNaN(
            player1ScoreNumber
        ) &&
        !Number.isNaN(
            player2ScoreNumber
        ) &&
        tournament?.format !==
            "round_robin" &&
        player1ScoreNumber ===
            player2ScoreNumber
            ? "Un match à élimination directe ne peut pas être nul."
            : "";

    const handleScreenshotChange = (
        event
    ) => {
        const file =
            event.target.files?.[0];

        if (!file) {
            setScreenshot(null);
            setScreenshotPreview("");

            return;
        }

        if (!file.type.startsWith("image/")) {
            setError(
                "Le fichier doit être une image."
            );

            event.target.value = "";

            return;
        }

        if (
            file.size >
            5 * 1024 * 1024
        ) {
            setError(
                "L'image ne doit pas dépasser 5 MB."
            );

            event.target.value = "";

            return;
        }

        setError("");
        setScreenshot(file);

        const preview =
            URL.createObjectURL(
                file
            );

        setScreenshotPreview(
            preview
        );
    };

    const handleSubmit =
        async (event) => {
            event.preventDefault();

            setError("");
            setSuccess("");

            if (!match) {
                setError(
                    "Match introuvable."
                );

                return;
            }

            if (
                !currentPlayerIsPlayer1 &&
                !currentPlayerIsPlayer2
            ) {
                setError(
                    "Vous ne participez pas à ce match."
                );

                return;
            }

            if (
                match.status !==
                "scheduled"
            ) {
                setError(
                    "Ce match ne peut plus recevoir de résultat."
                );

                return;
            }

            if (
                player1Score === "" ||
                player2Score === ""
            ) {
                setError(
                    "Veuillez entrer les deux scores."
                );

                return;
            }

            const score1 =
                Number(
                    player1Score
                );

            const score2 =
                Number(
                    player2Score
                );

            if (
                !Number.isInteger(
                    score1
                ) ||
                !Number.isInteger(
                    score2
                )
            ) {
                setError(
                    "Les scores doivent être des nombres entiers."
                );

                return;
            }

            if (
                score1 < 0 ||
                score2 < 0
            ) {
                setError(
                    "Les scores ne peuvent pas être négatifs."
                );

                return;
            }

            if (
                tournament?.format !==
                    "round_robin" &&
                score1 === score2
            ) {
                setError(
                    "Un match à élimination directe ne peut pas être nul."
                );

                return;
            }

            try {
                setSubmitting(true);

                const formData =
                    new FormData();

                formData.append(
                    "player1_score",
                    String(score1)
                );

                formData.append(
                    "player2_score",
                    String(score2)
                );

                if (screenshot) {
                    formData.append(
                        "screenshot",
                        screenshot
                    );
                }

                const response =
                    await api.post(
                        `/matches/${match.id}/result`,
                        formData,
                        {
                            headers: {
                                "Content-Type":
                                    "multipart/form-data",
                            },
                        }
                    );

                setSuccess(
                    response.data?.message ||
                        "Résultat envoyé. En attente de vérification."
                );

                setScreenshot(
                    null
                );

                setScreenshotPreview(
                    ""
                );

                await loadMatch(
                    true
                );
            } catch (err) {
                console.error(err);

                setError(
                    err.response?.data
                        ?.message ||
                        "Impossible d'envoyer le résultat."
                );
            } finally {
                setSubmitting(false);
            }
        };

    if (loading) {
        return (
            <PageLoader />
        );
    }

    if (
        error &&
        !match
    ) {
        return (
            <div className="max-w-5xl mx-auto py-8 px-4">
                <button
                    onClick={() =>
                        navigate(-1)
                    }
                    className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition mb-8"
                >
                    <ArrowLeft className="w-5 h-5" />
                    Retour
                </button>

                <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-red-300">
                    {error}
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 text-white">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">

                {/* HEADER */}
                <div className="flex items-center justify-between gap-4 mb-8">
                    <button
                        onClick={() =>
                            navigate(-1)
                        }
                        className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        Retour
                    </button>

                    <button
                        type="button"
                        onClick={() =>
                            loadMatch(
                                true
                            )
                        }
                        disabled={
                            refreshing
                        }
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

                {/* MATCH HEADER */}
                <section className="rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 overflow-hidden mb-6">

                    <div className="p-6 md:p-8 border-b border-slate-800">
                        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-5">

                            <div>
                                <div className="flex flex-wrap items-center gap-2 mb-4">

                                    <StatusBadge
                                        status={
                                            match?.status
                                        }
                                    />

                                    {match?.bracket && (
                                        <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 text-indigo-300 text-sm">
                                            <Swords className="w-4 h-4" />

                                            {
                                                bracketLabel
                                            }
                                        </span>
                                    )}
                                </div>

                                <h1 className="text-2xl md:text-3xl font-bold">
                                    Match Center
                                </h1>

                                <p className="text-slate-400 mt-2">
                                    {tournament?.name ??
                                        "Tournament"}
                                </p>
                            </div>

                            <div className="text-left md:text-right">
                                <div className="text-xs uppercase tracking-wider text-slate-500">
                                    Match
                                </div>

                                <div className="text-2xl font-black mt-1">
                                    #
                                    {
                                        match?.id
                                    }
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* META */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-slate-800">
                        <MetaItem
                            icon={
                                <Trophy className="w-4 h-4" />
                            }
                            label="Tour"
                            value={
                                roundLabel
                            }
                        />

                        <MetaItem
                            icon={
                                <Gamepad2 className="w-4 h-4" />
                            }
                            label="Jeu"
                            value={
                                tournament
                                    ?.game
                                    ?.name ??
                                "—"
                            }
                        />

                        <MetaItem
                            icon={
                                <Calendar className="w-4 h-4" />
                            }
                            label="Horaire"
                            value={
                                formatDate(
                                    match?.scheduled_at
                                )
                            }
                        />
                    </div>
                </section>

                {/* ERROR */}
                {error && (
                    <div className="mb-6 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-red-300">
                        <div className="flex items-start gap-3">
                            <XCircle className="w-5 h-5 shrink-0 mt-0.5" />

                            <span>
                                {error}
                            </span>
                        </div>
                    </div>
                )}

                {/* SUCCESS */}
                {success && (
                    <div className="mb-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-emerald-300">
                        <div className="flex items-start gap-3">
                            <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />

                            <span>
                                {success}
                            </span>
                        </div>
                    </div>
                )}

                {/* PLAYERS */}
                <section className="rounded-3xl border border-slate-800 bg-slate-900/70 overflow-hidden mb-6">

                    <div className="p-5 border-b border-slate-800">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                                <Users className="w-5 h-5" />
                            </div>

                            <div>
                                <h2 className="font-bold text-lg">
                                    Face à face
                                </h2>

                                <p className="text-sm text-slate-500">
                                    Votre adversaire pour ce match
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="p-6 md:p-8">
                        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] items-center gap-6">

                            <PlayerCard
                                name={
                                    player1Name
                                }
                                label="Joueur 1"
                                active={
                                    currentPlayerIsPlayer1
                                }
                                winner={
                                    Boolean(
                                        match?.winner_id &&
                                            Number(
                                                match.winner_id
                                            ) ===
                                                Number(
                                                    match.player1_id
                                                )
                                    )
                                }
                            />

                            <div className="flex flex-col items-center">
                                <div className="text-xs text-slate-600 uppercase tracking-[0.3em] mb-2">
                                    VS
                                </div>

                                <div className="w-14 h-14 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center">
                                    <Swords className="w-6 h-6 text-indigo-400" />
                                </div>
                            </div>

                            <PlayerCard
                                name={
                                    player2Name
                                }
                                label="Joueur 2"
                                active={
                                    currentPlayerIsPlayer2
                                }
                                winner={
                                    Boolean(
                                        match?.winner_id &&
                                            Number(
                                                match.winner_id
                                            ) ===
                                                Number(
                                                    match.player2_id
                                                )
                                    )
                                }
                            />
                        </div>
                    </div>
                </section>

                {/* RESULT */}
                {match?.status ===
                    "scheduled" && (
                    <section className="rounded-3xl border border-indigo-500/20 bg-indigo-500/[0.03] overflow-hidden mb-6">

                        <div className="p-5 border-b border-slate-800">
                            <div className="flex items-start gap-3">
                                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                                    <Swords className="w-5 h-5" />
                                </div>

                                <div>
                                    <h2 className="font-bold text-lg">
                                        Entrer le résultat
                                    </h2>

                                    <p className="text-sm text-slate-500 mt-1">
                                        Entrez le score final du match.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <form
                            onSubmit={
                                handleSubmit
                            }
                            className="p-6"
                        >
                            {!currentPlayerIsPlayer1 &&
                                !currentPlayerIsPlayer2 && (
                                    <div className="mb-5 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-red-300">
                                        Vous ne participez pas à ce match.
                                    </div>
                                )}

                            <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-5 items-end">

                                <ScoreInput
                                    label={
                                        player1Name
                                    }
                                    value={
                                        player1Score
                                    }
                                    onChange={
                                        setPlayer1Score
                                    }
                                    disabled={
                                        !canSubmit ||
                                        submitting
                                    }
                                    highlight={
                                        currentPlayerIsPlayer1
                                    }
                                />

                                <div className="text-center text-slate-600 font-bold pb-3">
                                    -
                                </div>

                                <ScoreInput
                                    label={
                                        player2Name
                                    }
                                    value={
                                        player2Score
                                    }
                                    onChange={
                                        setPlayer2Score
                                    }
                                    disabled={
                                        !canSubmit ||
                                        submitting
                                    }
                                    highlight={
                                        currentPlayerIsPlayer2
                                    }
                                />
                            </div>

                            {scoreError && (
                                <div className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-sm text-amber-300">
                                    {scoreError}
                                </div>
                            )}

                            {/* SCREENSHOT */}
                            <div className="mt-6">
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Preuve du résultat
                                    <span className="text-slate-600 ml-2">
                                        Optionnel
                                    </span>
                                </label>

                                <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-950/50 p-5">

                                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">

                                        <label className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 cursor-pointer transition">
                                            <Upload className="w-4 h-4" />

                                            Choisir une image

                                            <input
                                                type="file"
                                                accept="image/png,image/jpeg,image/webp"
                                                onChange={
                                                    handleScreenshotChange
                                                }
                                                disabled={
                                                    !canSubmit ||
                                                    submitting
                                                }
                                                className="hidden"
                                            />
                                        </label>

                                        <div className="text-sm text-slate-500">
                                            JPG, PNG ou WebP — max 5 MB
                                        </div>
                                    </div>

                                    {screenshot && (
                                        <div className="mt-4 flex items-center gap-3 rounded-xl bg-slate-900 p-3">
                                            <ImageIcon className="w-5 h-5 text-indigo-400" />

                                            <div className="min-w-0">
                                                <div className="text-sm text-slate-200 truncate">
                                                    {
                                                        screenshot.name
                                                    }
                                                </div>

                                                <div className="text-xs text-slate-500">
                                                    {formatFileSize(
                                                        screenshot.size
                                                    )}
                                                </div>
                                            </div>

                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setScreenshot(
                                                        null
                                                    );

                                                    setScreenshotPreview(
                                                        ""
                                                    );
                                                }}
                                                className="ml-auto text-slate-500 hover:text-red-400"
                                            >
                                                <XCircle className="w-5 h-5" />
                                            </button>
                                        </div>
                                    )}

                                    {screenshotPreview && (
                                        <div className="mt-4">
                                            <img
                                                src={
                                                    screenshotPreview
                                                }
                                                alt="Aperçu de la preuve"
                                                className="max-h-72 rounded-xl border border-slate-800 object-contain"
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

                                <div className="text-sm text-slate-500">
                                    <div className="flex items-center gap-2">
                                        <Shield className="w-4 h-4" />

                                        Le résultat sera vérifié par l'organisateur.
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={
                                        !canSubmit ||
                                        submitting ||
                                        Boolean(
                                            scoreError
                                        ) ||
                                        player1Score ===
                                            "" ||
                                        player2Score ===
                                            ""
                                    }
                                    className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed transition font-semibold"
                                >
                                    {submitting ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Envoi...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle2 className="w-4 h-4" />
                                            Envoyer le résultat
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </section>
                )}

                {/* PENDING */}
                {hasPendingResult && (
                    <section className="rounded-3xl border border-amber-500/20 bg-amber-500/[0.03] p-6 mb-6">
                        <div className="flex items-start gap-4">
                            <div className="w-11 h-11 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
                                <Clock className="w-5 h-5" />
                            </div>

                            <div>
                                <h2 className="font-bold text-lg">
                                    Résultat en attente
                                </h2>

                                <p className="text-sm text-slate-400 mt-1 leading-relaxed">
                                    Le résultat a été envoyé et attend maintenant la vérification de l'organisateur.
                                </p>
                            </div>
                        </div>
                    </section>
                )}

                {/* COMPLETED */}
                {match?.status ===
                    "completed" && (
                    <section
                        className={`rounded-3xl border p-6 mb-6 ${
                            isWinner
                                ? "border-emerald-500/20 bg-emerald-500/[0.04]"
                                : isLoser
                                    ? "border-red-500/20 bg-red-500/[0.03]"
                                    : "border-slate-800 bg-slate-900/60"
                        }`}
                    >
                        <div className="flex flex-col sm:flex-row sm:items-center gap-5">

                            <div
                                className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
                                    isWinner
                                        ? "bg-emerald-500/10 text-emerald-400"
                                        : isLoser
                                            ? "bg-red-500/10 text-red-400"
                                            : "bg-slate-800 text-slate-400"
                                }`}
                            >
                                {isWinner ? (
                                    <Crown className="w-7 h-7" />
                                ) : isLoser ? (
                                    <XCircle className="w-7 h-7" />
                                ) : (
                                    <CheckCircle2 className="w-7 h-7" />
                                )}
                            </div>

                            <div className="flex-1">
                                <h2 className="font-bold text-xl">
                                    {isWinner
                                        ? "Victoire ! 🏆"
                                        : isLoser
                                            ? "Match perdu"
                                            : "Match terminé"}
                                </h2>

                                <p className="text-sm text-slate-400 mt-1">
                                    {matchWinnerName
                                        ? `Le gagnant est ${matchWinnerName}.`
                                        : "Le résultat du match a été confirmé."}
                                </p>
                            </div>

                            <div className="text-3xl font-black">
                                {
                                    match.player1_score
                                }

                                <span className="text-slate-600 mx-2">
                                    -
                                </span>

                                {
                                    match.player2_score
                                }
                            </div>
                        </div>
                    </section>
                )}

                {/* PENDING MATCH */}
                {match?.status ===
                    "pending" && (
                    <section className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6">
                        <div className="flex items-start gap-4">
                            <Clock className="w-6 h-6 text-slate-500 shrink-0" />

                            <div>
                                <h2 className="font-bold">
                                    Match en attente
                                </h2>

                                <p className="text-sm text-slate-500 mt-1">
                                    Ce match n'a pas encore reçu ses deux joueurs.
                                </p>
                            </div>
                        </div>
                    </section>
                )}

                {/* CANCELLED */}
                {match?.status ===
                    "cancelled" && (
                    <section className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6">
                        <div className="flex items-start gap-4">
                            <XCircle className="w-6 h-6 text-slate-500 shrink-0" />

                            <div>
                                <h2 className="font-bold">
                                    Match annulé
                                </h2>

                                <p className="text-sm text-slate-500 mt-1">
                                    Ce match n'est plus nécessaire.
                                </p>
                            </div>
                        </div>
                    </section>
                )}

                {/* TOURNAMENT LINK */}
                <div className="flex justify-center pt-4">
                    <button
                        onClick={() =>
                            navigate(
                                `/tournaments/${tournamentId}`
                            )
                        }
                        className="inline-flex items-center gap-2 text-slate-500 hover:text-white transition"
                    >
                        <Trophy className="w-4 h-4" />

                        Voir le tournoi
                    </button>
                </div>
            </div>
        </div>
    );
}

/*
|--------------------------------------------------------------------------
| PLAYER CARD
|--------------------------------------------------------------------------
*/

function PlayerCard({
    name,
    label,
    active,
    winner,
}) {
    return (
        <div
            className={`relative rounded-2xl border p-5 ${
                winner
                    ? "border-emerald-500/30 bg-emerald-500/[0.06]"
                    : active
                        ? "border-indigo-500/30 bg-indigo-500/[0.05]"
                        : "border-slate-800 bg-slate-950/50"
            }`}
        >
            {winner && (
                <div className="absolute top-3 right-3">
                    <Crown className="w-5 h-5 text-yellow-400" />
                </div>
            )}

            <div className="text-xs text-slate-500 mb-2">
                {label}
            </div>

            <div className="flex items-center gap-3">
                <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold ${
                        winner
                            ? "bg-emerald-500/10 text-emerald-400"
                            : active
                                ? "bg-indigo-500/10 text-indigo-400"
                                : "bg-slate-800 text-slate-400"
                    }`}
                >
                    {name
                        ?.charAt(
                            0
                        )
                        ?.toUpperCase() ??
                        "?"}
                </div>

                <div className="min-w-0">
                    <div className="font-bold text-white truncate">
                        {name}
                    </div>

                    {active && (
                        <div className="text-xs text-indigo-400 mt-0.5">
                            Vous
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

/*
|--------------------------------------------------------------------------
| SCORE INPUT
|--------------------------------------------------------------------------
*/

function ScoreInput({
    label,
    value,
    onChange,
    disabled,
    highlight,
}) {
    return (
        <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
                {label}
            </label>

            <input
                type="number"
                min="0"
                step="1"
                inputMode="numeric"
                value={value}
                onChange={(event) =>
                    onChange(
                        event.target.value
                    )
                }
                disabled={
                    disabled
                }
                placeholder="0"
                className={`w-full rounded-2xl border bg-slate-950 px-5 py-4 text-2xl font-black text-center outline-none transition ${
                    highlight
                        ? "border-indigo-500/40 focus:border-indigo-500"
                        : "border-slate-800 focus:border-slate-600"
                } disabled:opacity-50`}
            />
        </div>
    );
}

/*
|--------------------------------------------------------------------------
| META
|--------------------------------------------------------------------------
*/

function MetaItem({
    icon,
    label,
    value,
}) {
    return (
        <div className="bg-slate-900 p-4">
            <div className="flex items-center gap-2 text-slate-500 text-xs mb-1">
                {icon}
                {label}
            </div>

            <div className="text-sm font-semibold text-slate-200 truncate">
                {value}
            </div>
        </div>
    );
}

/*
|--------------------------------------------------------------------------
| STATUS
|--------------------------------------------------------------------------
*/

function StatusBadge({
    status,
}) {
    const info =
        getStatusInfo(
            status
        );

    return (
        <span
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm ${info.className}`}
        >
            {info.icon}

            {info.label}
        </span>
    );
}

function getStatusInfo(
    status
) {
    switch (status) {
        case "scheduled":
            return {
                label: "Programmé",
                className:
                    "bg-blue-500/10 text-blue-400",
                icon: (
                    <Clock className="w-4 h-4" />
                ),
            };

        case "in_progress":
            return {
                label: "En cours",
                className:
                    "bg-amber-500/10 text-amber-400",
                icon: (
                    <Swords className="w-4 h-4" />
                ),
            };

        case "completed":
            return {
                label: "Terminé",
                className:
                    "bg-emerald-500/10 text-emerald-400",
                icon: (
                    <CheckCircle2 className="w-4 h-4" />
                ),
            };

        case "pending":
            return {
                label: "En attente",
                className:
                    "bg-slate-700 text-slate-400",
                icon: (
                    <Clock className="w-4 h-4" />
                ),
            };

        case "cancelled":
            return {
                label: "Annulé",
                className:
                    "bg-red-500/10 text-red-400",
                icon: (
                    <XCircle className="w-4 h-4" />
                ),
            };

        default:
            return {
                label:
                    status ??
                    "Inconnu",
                className:
                    "bg-slate-700 text-slate-400",
                icon: (
                    <Clock className="w-4 h-4" />
                ),
            };
    }
}

/*
|--------------------------------------------------------------------------
| HELPERS
|--------------------------------------------------------------------------
*/

function getPlayerName(
    player
) {
    return (
        player?.user?.name ??
        player?.name ??
        player?.player_name ??
        "À déterminer"
    );
}

function getBracketLabel(
    bracket
) {
    switch (bracket) {
        case "winners":
            return "Winners Bracket";

        case "losers":
            return "Losers Bracket";

        case "grand_final":
            return "Grand Final";

        case "grand_final_reset":
            return "Grand Final Reset";

        default:
            return "Match";
    }
}

function getRoundLabel(
    match
) {
    if (!match) {
        return "—";
    }

    if (
        match.bracket ===
        "grand_final"
    ) {
        return "Grand Final";
    }

    if (
        match.bracket ===
        "grand_final_reset"
    ) {
        return "Grand Final Reset";
    }

    if (
        match.bracket ===
        "winners"
    ) {
        return `Winners Round ${
            match.round
        }`;
    }

    if (
        match.bracket ===
        "losers"
    ) {
        return `Losers Round ${
            match.round
        }`;
    }

    return `Round ${
        match.round ??
        "—"
    }`;
}

function formatDate(
    date
) {
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

function formatFileSize(
    bytes
) {
    if (
        !bytes ||
        bytes <= 0
    ) {
        return "0 KB";
    }

    if (
        bytes <
        1024 * 1024
    ) {
        return `${Math.round(
            bytes / 1024
        )} KB`;
    }

    return `${(
        bytes /
        (1024 * 1024)
    ).toFixed(1)} MB`;
}

function PageLoader() {
    return (
        <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
            <div className="flex items-center gap-3 text-slate-400">
                <Loader2 className="w-6 h-6 animate-spin" />

                Chargement du Match Center...
            </div>
        </div>
    );
}

export default MatchCenter;