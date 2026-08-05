using Microsoft.EntityFrameworkCore;
using MoiBackend.Core.DTOs;
using MoiBackend.Core.Entities;
using MoiBackend.Core.Interfaces;
using MoiBackend.Infrastructure.Data;

namespace MoiBackend.Infrastructure.Services;

public class GoldEntryService : IGoldEntryService
{
    private readonly MoiDbContext _dbContext;

    public GoldEntryService(MoiDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<GoldEntryResponse> RecordGoldEntryAsync(GoldEntryRequest request)
    {
        var evt = await _dbContext.Events.FindAsync(request.EventId)
            ?? throw new InvalidOperationException("Event not found");

        var contributor = await _dbContext.Contributors
            .FirstOrDefaultAsync(c => c.Name == request.ContributorName && c.Village == request.Village);

        if (contributor == null)
        {
            contributor = new Contributor
            {
                Name = request.ContributorName,
                Village = request.Village
            };
            _dbContext.Contributors.Add(contributor);
            await _dbContext.SaveChangesAsync();
        }

        var entry = new GoldEntry
        {
            GoldDetails = request.GoldDetails,
            EntryDate = DateTime.UtcNow,
            EventId = evt.Id,
            ContributorId = contributor.Id
        };

        _dbContext.GoldEntries.Add(entry);
        await _dbContext.SaveChangesAsync();

        var serialNo = await _dbContext.GoldEntries
            .Where(g => g.EventId == evt.Id && g.Id <= entry.Id)
            .CountAsync();

        return MapToResponse(entry, serialNo);
    }

    public async Task<List<GoldEntryResponse>> GetRecent6EntriesAsync(long eventId)
    {
        var list = await _dbContext.GoldEntries
            .AsNoTracking()
            .Where(g => g.EventId == eventId)
            .Include(g => g.Contributor)
            .OrderByDescending(g => g.Id)
            .Take(6)
            .ToListAsync();

        return list.Select(ge =>
        {
            var serialNo = _dbContext.GoldEntries
                .Count(g => g.EventId == eventId && g.Id <= ge.Id);

            return MapToResponse(ge, serialNo);
        }).ToList();
    }

    public async Task<List<GoldEntryResponse>> GetAllEntriesByEventAsync(long eventId)
    {
        var list = await _dbContext.GoldEntries
            .AsNoTracking()
            .Where(g => g.EventId == eventId)
            .Include(g => g.Contributor)
            .OrderBy(g => g.Id)
            .ToListAsync();

        long serialNo = 1;
        return list.Select(ge => MapToResponse(ge, serialNo++)).ToList();
    }

    public async Task<GoldEntryResponse> UpdateGoldEntryAsync(long id, GoldEntryRequest request)
    {
        var entry = await _dbContext.GoldEntries
            .Include(g => g.Contributor)
            .FirstOrDefaultAsync(g => g.Id == id)
            ?? throw new InvalidOperationException("Entry not found");

        entry.Contributor.Name = request.ContributorName;
        entry.Contributor.Village = request.Village;
        entry.GoldDetails = request.GoldDetails;

        await _dbContext.SaveChangesAsync();

        var serialNo = await _dbContext.GoldEntries
            .Where(g => g.EventId == entry.EventId && g.Id <= entry.Id)
            .CountAsync();

        return MapToResponse(entry, serialNo);
    }

    public async Task DeleteGoldEntryAsync(long id)
    {
        var entry = await _dbContext.GoldEntries.FindAsync(id);
        if (entry != null)
        {
            try
            {
                _dbContext.GoldEntries.Remove(entry);
                await _dbContext.SaveChangesAsync();
            }
            catch (Microsoft.EntityFrameworkCore.DbUpdateConcurrencyException)
            {
                // Already deleted
            }
        }
    }

    private static GoldEntryResponse MapToResponse(GoldEntry entry, long serialNo)
    {
        return new GoldEntryResponse
        {
            Id = entry.Id,
            SerialNumber = serialNo,
            ContributorName = entry.Contributor?.Name ?? string.Empty,
            Village = entry.Contributor?.Village ?? string.Empty,
            GoldDetails = entry.GoldDetails,
            EntryDate = entry.EntryDate,
            EventId = entry.EventId
        };
    }
}
