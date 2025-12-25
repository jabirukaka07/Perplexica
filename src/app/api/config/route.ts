import configManager from '@/lib/config';
import ModelRegistry from '@/lib/models/registry';
import { NextRequest, NextResponse } from 'next/server';
import { ConfigModelProvider } from '@/lib/config/types';
import { isAdminRequest } from '@/lib/middleware/adminAuth';

type SaveConfigBody = {
  key: string;
  value: string;
};

export const GET = async (req: NextRequest) => {
  try {
    const values = configManager.getCurrentConfig();
    const fields = configManager.getUIConfigSections();

    const modelRegistry = new ModelRegistry();
    const modelProviders = await modelRegistry.getActiveProviders();

    values.modelProviders = values.modelProviders.map(
      (mp: ConfigModelProvider) => {
        const activeProvider = modelProviders.find((p) => p.id === mp.id);

        return {
          ...mp,
          chatModels: activeProvider?.chatModels ?? mp.chatModels,
          embeddingModels:
            activeProvider?.embeddingModels ?? mp.embeddingModels,
        };
      },
    );

    // 检查是否是管理员请求
    const isAdmin = isAdminRequest(req);

    // 如果不是管理员，过滤敏感配置
    if (!isAdmin) {
      // 保留 fields.modelProviders - 这是 provider 类型的元数据，不是敏感信息
      // 用户需要知道可以添加哪些类型的 provider（如 OpenAI、Anthropic 等）

      // 移除 search 字段定义（服务端配置）
      fields.search = [];

      // 清空敏感配置值（但保留结构供前端显示）
      values.modelProviders = values.modelProviders.map((p: ConfigModelProvider) => ({
        ...p,
        config: {}, // 清空所有provider配置（API keys等敏感信息）
      }));
      values.search = {}; // 清空搜索配置
    }

    return NextResponse.json({
      values,
      fields,
      isAdmin, // 告诉前端当前是否是管理员模式
    });
  } catch (err) {
    console.error('Error in getting config: ', err);
    return Response.json(
      { message: 'An error has occurred.' },
      { status: 500 },
    );
  }
};

export const POST = async (req: NextRequest) => {
  try {
    // 检查管理员权限
    const isAdmin = isAdminRequest(req);

    if (!isAdmin) {
      return NextResponse.json(
        { message: 'Admin authentication required to update configuration.' },
        { status: 403 }
      );
    }

    const body: SaveConfigBody = await req.json();

    if (!body.key || !body.value) {
      return Response.json(
        {
          message: 'Key and value are required.',
        },
        {
          status: 400,
        },
      );
    }

    configManager.updateConfig(body.key, body.value);

    console.log(`[Config] Admin updated config: ${body.key}`);

    return Response.json(
      {
        message: 'Config updated successfully.',
      },
      {
        status: 200,
      },
    );
  } catch (err) {
    console.error('Error in updating config: ', err);
    return Response.json(
      { message: 'An error has occurred.' },
      { status: 500 },
    );
  }
};
