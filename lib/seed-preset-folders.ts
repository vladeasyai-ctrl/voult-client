import { api } from './api';
import type { PresetChildTemplate } from './presets';

export async function seedPresetFolders(
  spaceId: string,
  branches: PresetChildTemplate[],
): Promise<void> {
  for (const branch of branches) {
    const folder = await api.createFolder(branch.name, spaceId, null, {
      iconKey: branch.iconKey,
      color: branch.color,
    });
    if (branch.seedChildren?.length) {
      await Promise.all(
        branch.seedChildren.map((child) =>
          api.createFolder(child.name, spaceId, folder.id, {
            iconKey: child.iconKey,
            color: child.color,
          }),
        ),
      );
    }
  }
}
