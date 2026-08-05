using Microsoft.EntityFrameworkCore;
using MoiBackend.Core.DTOs;
using MoiBackend.Core.Entities;
using MoiBackend.Core.Interfaces;
using MoiBackend.Infrastructure.Data;

namespace MoiBackend.Infrastructure.Services;

public class GivenMoiService : IGivenMoiService
{
    private readonly MoiDbContext _context;

    public GivenMoiService(MoiDbContext context)
    {
        _context = context;
    }

    public async Task<GivenMoiResponse> RecordGivenMoiAsync(GivenMoiRequest request)
    {
        var entry = new GivenMoiEntry
        {
            RecipientName = request.RecipientName.Trim(),
            Village = request.Village?.Trim(),
            Amount = request.Amount,
            GiftType = string.IsNullOrWhiteSpace(request.GiftType) ? "Cash" : request.GiftType.Trim(),
            GoldDetails = request.GoldDetails?.Trim(),
            Occasion = request.Occasion?.Trim(),
            GiftTerm = request.GiftTerm?.Trim(),
            GivenDate = request.GivenDate ?? DateTime.UtcNow,
            Notes = request.Notes?.Trim(),
            EventId = request.EventId
        };

        _context.GivenMoiEntries.Add(entry);
        await _context.SaveChangesAsync();

        return MapToResponse(entry);
    }

    public async Task<GivenMoiResponse> UpdateGivenMoiAsync(long id, GivenMoiRequest request)
    {
        var entry = await _context.GivenMoiEntries.FindAsync(id);
        if (entry == null)
        {
            throw new KeyNotFoundException($"Given Moi entry with ID {id} not found.");
        }

        entry.RecipientName = request.RecipientName.Trim();
        entry.Village = request.Village?.Trim();
        entry.Amount = request.Amount;
        entry.GiftType = string.IsNullOrWhiteSpace(request.GiftType) ? "Cash" : request.GiftType.Trim();
        entry.GoldDetails = request.GoldDetails?.Trim();
        entry.Occasion = request.Occasion?.Trim();
        entry.GiftTerm = request.GiftTerm?.Trim();
        if (request.GivenDate.HasValue)
        {
            entry.GivenDate = request.GivenDate.Value;
        }
        entry.Notes = request.Notes?.Trim();
        entry.EventId = request.EventId;

        await _context.SaveChangesAsync();

        return MapToResponse(entry);
    }

    public async Task DeleteGivenMoiAsync(long id)
    {
        var entry = await _context.GivenMoiEntries.FindAsync(id);
        if (entry != null)
        {
            try
            {
                _context.GivenMoiEntries.Remove(entry);
                await _context.SaveChangesAsync();
            }
            catch (Microsoft.EntityFrameworkCore.DbUpdateConcurrencyException)
            {
                // Already deleted
            }
        }
    }

    public async Task<List<GivenMoiResponse>> GetAllGivenMoiAsync()
    {
        var list = await _context.GivenMoiEntries
            .OrderByDescending(x => x.GivenDate)
            .ToListAsync();

        return list.Select(MapToResponse).ToList();
    }

    public async Task<List<GivenMoiResponse>> GetGivenMoiByEventAsync(long eventId)
    {
            var list = await _context.GivenMoiEntries
            .Where(x => x.EventId == eventId || x.EventId == null)
            .OrderByDescending(x => x.GivenDate)
            .ToListAsync();

        return list.Select(MapToResponse).ToList();
    }

    private static GivenMoiResponse MapToResponse(GivenMoiEntry entry)
    {
        return new GivenMoiResponse
        {
            Id = entry.Id,
            RecipientName = entry.RecipientName,
            Village = entry.Village,
            Amount = entry.Amount,
            GiftType = entry.GiftType ?? "Cash",
            GoldDetails = entry.GoldDetails,
            Occasion = entry.Occasion,
            GiftTerm = entry.GiftTerm,
            GivenDate = entry.GivenDate,
            Notes = entry.Notes,
            EventId = entry.EventId
        };
    }
}
