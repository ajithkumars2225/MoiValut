namespace MoiBackend.Core.DTOs;

public class ConflictCheckResponse
{
    public long? Id { get; set; }
    public string RecipientName { get; set; } = null!;
    public string? Village { get; set; }

    /// <summary>What they are giving us NOW (current Moi Entry)</summary>
    public decimal TheirCurrentAmount { get; set; }

    /// <summary>Total we previously gave them (sum of Given Moi entries)</summary>
    public decimal OurPrevGivenAmount { get; set; }

    /// <summary>Matched | Short | Excess | NoPreviousRecord</summary>
    public string ConflictStatus { get; set; } = "NoPreviousRecord";

    public string? ConflictNote { get; set; }

    /// <summary>
    /// Difference = TheirCurrentAmount - OurPrevGivenAmount
    /// Positive = they gave more than we gave (Excess)
    /// Negative = they gave less than we gave (Short)
    /// Zero = exact match (Matched)
    /// </summary>
    public decimal Difference { get; set; }

    public bool HasConflict { get; set; }

    public long? MoiTransactionId { get; set; }
    public long? EventId { get; set; }
    public DateTime CheckedAt { get; set; }

    /// <summary>Given Moi entries that matched this person (for audit display)</summary>
    public List<MatchedTransactionDetail> MatchedGivenEntries { get; set; } = new();
}

public class MatchedTransactionDetail
{
    public long Id { get; set; }
    public decimal Amount { get; set; }
    public decimal? ReturnAmount { get; set; }
    public string? GiftTerm { get; set; }
    public DateTime TransactionDate { get; set; }
}
