export type LineConfig = {
  channelAccessToken: string;
  channelSecret: string;
};

type LineTemplateAction =
  | {
      type: "uri";
      label: string;
      uri: string;
    }
  | {
      type: "message";
      label: string;
      text: string;
    };

type LineTemplate =
  | {
      type: "buttons";
      text: string;
      actions: LineTemplateAction[];
    }
  | {
      type: "confirm";
      text: string;
      actions: LineTemplateAction[];
    };

export type LineMessage =
  | {
      type: "text";
      text: string;
    }
  | {
      type: "template";
      altText: string;
      template: LineTemplate;
    }
  | {
      type: "flex";
      altText: string;
      contents: any; // Flex Message has complex nested structure
    };

export type LineProfile = {
  userId: string;
  displayName: string;
  pictureUrl?: string | null;
};

export type LineProfileResponse = {
  userId: string;
  displayName: string;
  pictureUrl?: string;
  statusMessage?: string;
};

export type VerifiedLiffToken = {
  sub: string;
  name?: string;
  picture?: string;
  email?: string;
};

export type LineVerifyResponse = {
  client_id: string;
  expires_in: number;
  scope?: string;
  error?: string;
  error_description?: string;
};
