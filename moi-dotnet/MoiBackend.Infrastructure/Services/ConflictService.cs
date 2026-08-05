using Microsoft.EntityFrameworkCore;
using MoiBackend.Core.DTOs;
using MoiBackend.Core.Entities;
using MoiBackend.Core.Interfaces;
using MoiBackend.Infrastructure.Data;

namespace MoiBackend.Infrastructure.Services;

public class ConflictService : IConflictService
{
    private readonly MoiDbContext _context;

    public ConflictService(MoiDbContext context)
    {
        _context = context;
    }

    public async Task<ConflictCheckResponse> CheckConflictAsync(ConflictCheckRequest request)
    {
        return await PerformCheckAsync(request);
    }

    public async Task<ConflictCheckResponse> CheckAndSaveConflictAsync(ConflictCheckRequest request)
    {
        var result = await PerformCheckAsync(request);

        long? validEventId = null;
        if (request.EventId.HasValue && request.EventId.Value > 0)
        {
            if (await _context.Events.AnyAsync(e => e.Id == request.EventId.Value))
            {
                validEventId = request.EventId.Value;
            }
        }

        // Save the result to DB for audit/history
        var record = new ConflictRecord
        {
            RecipientName        = request.RecipientName.Trim(),
            Village              = request.Village?.Trim(),
            OurGivenAmount       = request.PrevReturnAmount,    // Prev Return entered in modal
            TheirTotalGiftAmount = result.OurPrevGivenAmount,   // Given Amount from Record Given Gift ledger
            ConflictStatus       = result.ConflictStatus,
            ConflictNote         = result.ConflictNote,
            GivenMoiEntryId      = request.MoiTransactionId,
            EventId              = validEventId,
            CheckedAt            = DateTime.UtcNow
        };

        _context.ConflictRecords.Add(record);
        await _context.SaveChangesAsync();
        result.Id = record.Id;

        return result;
    }

    /// <summary>
    /// CONFLICT LOGIC:
    /// Compare PrevReturnAmount entered in Record Cash Gift (Moi Entry)
    /// against Given Amount (g.Amount) recorded in Given Moi ledger (given_moi_entries table)
    /// for matching Recipient Name + Village.
    /// </summary>
    private async Task<ConflictCheckResponse> PerformCheckAsync(ConflictCheckRequest request)
    {
        decimal userPrevReturn = request.PrevReturnAmount;
        decimal currentGift    = request.TheirCurrentAmount;

        var nameNorm    = request.RecipientName.Trim().ToLower();
        var villageNorm = request.Village?.Trim().ToLower();

        // Search Given Moi entries (Record Given Gift) for this person
        var matchedGivenEntries = await _context.GivenMoiEntries
            .Where(g =>
                g.RecipientName.ToLower() == nameNorm &&
                (string.IsNullOrEmpty(villageNorm) ||
                 g.Village != null && g.Village.ToLower() == villageNorm))
            .OrderByDescending(g => g.GivenDate)
            .ToListAsync();

        decimal recordedGivenTotal = matchedGivenEntries.Sum(g => g.Amount);

        var response = new ConflictCheckResponse
        {
            RecipientName       = request.RecipientName,
            Village             = request.Village,
            TheirCurrentAmount  = currentGift,
            OurPrevGivenAmount  = recordedGivenTotal,
            MoiTransactionId    = request.MoiTransactionId,
            EventId             = request.EventId,
            CheckedAt           = DateTime.UtcNow,
            MatchedGivenEntries = matchedGivenEntries.Select(g => new MatchedTransactionDetail
            {
                Id              = g.Id,
                Amount          = g.Amount,
                GiftTerm        = g.GiftTerm,
                TransactionDate = g.GivenDate
            }).ToList()
        };

        var nameDisplay = $"'{request.RecipientName}'" +
            (string.IsNullOrEmpty(request.Village) ? "" : $" ({request.Village})");

        if (recordedGivenTotal <= 0 && userPrevReturn <= 0)
        {
            response.Difference     = 0;
            response.ConflictStatus = "NoPreviousRecord";
            response.HasConflict    = false;
            response.ConflictNote   =
                $"Record Given Gift ஏட்டிலோ, Prev Return உள்ளீட்டிலோ {nameDisplay} நபருக்கு பதிவு இல்லை.";
            return response;
        }

        // Compare User's entered Prev Return vs Recorded Given Amount in Given Moi ledger
        decimal diff = userPrevReturn - recordedGivenTotal;
        response.Difference = diff;

        if (recordedGivenTotal > 0 && diff == 0)
        {
            response.ConflictStatus = "Matched";
            response.HasConflict    = false;
            response.ConflictNote   =
                $"✅ சரியான திருப்பம்! Prev Return (₹{userPrevReturn:N0}) " +
                $"ஏற்கனவே Record Given Gift-ல் பதிவு செய்யப்பட்ட தொகையுடன் (₹{recordedGivenTotal:N0}) சரியாகப் பொருந்துகிறது!";
        }
        else if (recordedGivenTotal > 0 && diff < 0)
        {
            response.ConflictStatus = "Short";
            response.HasConflict    = true;
            response.ConflictNote   =
                $"⚠️ குறைவான திருப்பம்! Record Given Gift-ல் பதிவு செய்யப்பட்ட தொகை ₹{recordedGivenTotal:N0}. " +
                $"ஆனால் Prev Return-ல் ₹{userPrevReturn:N0} மட்டுமே உள்ளது. (குறைபாடு: ₹{Math.Abs(diff):N0}).";
        }
        else if (recordedGivenTotal > 0 && diff > 0)
        {
            response.ConflictStatus = "Excess";
            response.HasConflict    = true;
            response.ConflictNote   =
                $"🔺 அதிக திருப்பம்! Record Given Gift-ல் பதிவு செய்யப்பட்ட தொகை ₹{recordedGivenTotal:N0}. " +
                $"ஆனால் Prev Return-ல் ₹{userPrevReturn:N0} உள்ளது. (அதிகம்: ₹{diff:N0}).";
        }
        else
        {
            response.ConflictStatus = "NoPreviousRecord";
            response.HasConflict    = false;
            response.ConflictNote   =
                $"Record Given Gift ஏட்டில் {nameDisplay} நபருக்கு முன்பதிவு இல்லை. Prev Return: ₹{userPrevReturn:N0}.";
        }

        return response;
    }

    public async Task<List<ConflictCheckResponse>> GetAllConflictsAsync()
    {
        var records = await _context.ConflictRecords
            .OrderByDescending(r => r.CheckedAt)
            .ToListAsync();
        return records.Select(MapToResponse).ToList();
    }

    public async Task<List<ConflictCheckResponse>> GetConflictsByEventAsync(long eventId)
    {
        var records = await _context.ConflictRecords
            .Where(r => r.EventId == eventId)
            .OrderByDescending(r => r.CheckedAt)
            .ToListAsync();
        return records.Select(MapToResponse).ToList();
    }

    public async Task DeleteConflictAsync(long id)
    {
        var record = await _context.ConflictRecords.FindAsync(id);
        if (record != null)
        {
            try
            {
                _context.ConflictRecords.Remove(record);
                await _context.SaveChangesAsync();
            }
            catch (Microsoft.EntityFrameworkCore.DbUpdateConcurrencyException)
            {
                // Already deleted
            }
        }
    }

    private static ConflictCheckResponse MapToResponse(ConflictRecord r) =>
        new ConflictCheckResponse
        {
            Id                   = r.Id,
            RecipientName        = r.RecipientName,
            Village              = r.Village,
            OurPrevGivenAmount   = r.OurGivenAmount,
            TheirCurrentAmount   = r.TheirTotalGiftAmount,
            ConflictStatus       = r.ConflictStatus,
            ConflictNote         = r.ConflictNote,
            Difference           = r.OurGivenAmount - r.TheirTotalGiftAmount,
            HasConflict          = r.ConflictStatus == "Short" || r.ConflictStatus == "Excess",
            MoiTransactionId     = r.GivenMoiEntryId,
            EventId              = r.EventId,
            CheckedAt            = r.CheckedAt
        };
}
