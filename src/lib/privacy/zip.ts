const encoder = new TextEncoder();

type ZipEntry = {
  name: string;
  data: string | Uint8Array;
  modifiedAt?: Date;
};

function toBytes(data: string | Uint8Array) {
  return typeof data === "string" ? encoder.encode(data) : data;
}

function getDosTimestamp(date: Date) {
  const year = Math.max(1980, date.getUTCFullYear());
  const month = date.getUTCMonth() + 1;
  const day = date.getUTCDate();
  const hours = date.getUTCHours();
  const minutes = date.getUTCMinutes();
  const seconds = Math.floor(date.getUTCSeconds() / 2);

  return {
    time: (hours << 11) | (minutes << 5) | seconds,
    date: ((year - 1980) << 9) | (month << 5) | day,
  };
}

function makeCrcTable() {
  const table = new Uint32Array(256);

  for (let i = 0; i < 256; i += 1) {
    let value = i;
    for (let bit = 0; bit < 8; bit += 1) {
      value = (value & 1) === 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
    }
    table[i] = value >>> 0;
  }

  return table;
}

const crcTable = makeCrcTable();

function crc32(bytes: Uint8Array) {
  let value = 0xffffffff;

  for (const byte of bytes) {
    value = crcTable[(value ^ byte) & 0xff] ^ (value >>> 8);
  }

  return (value ^ 0xffffffff) >>> 0;
}

function createLocalFileHeader(input: {
  nameBytes: Uint8Array;
  dataBytes: Uint8Array;
  crc: number;
  modifiedAt: Date;
}) {
  const header = new Uint8Array(30 + input.nameBytes.length);
  const view = new DataView(header.buffer);
  const dos = getDosTimestamp(input.modifiedAt);

  view.setUint32(0, 0x04034b50, true);
  view.setUint16(4, 20, true);
  view.setUint16(6, 0, true);
  view.setUint16(8, 0, true);
  view.setUint16(10, dos.time, true);
  view.setUint16(12, dos.date, true);
  view.setUint32(14, input.crc, true);
  view.setUint32(18, input.dataBytes.length, true);
  view.setUint32(22, input.dataBytes.length, true);
  view.setUint16(26, input.nameBytes.length, true);
  view.setUint16(28, 0, true);
  header.set(input.nameBytes, 30);

  return header;
}

function createCentralDirectoryHeader(input: {
  nameBytes: Uint8Array;
  dataBytes: Uint8Array;
  crc: number;
  modifiedAt: Date;
  offset: number;
}) {
  const header = new Uint8Array(46 + input.nameBytes.length);
  const view = new DataView(header.buffer);
  const dos = getDosTimestamp(input.modifiedAt);

  view.setUint32(0, 0x02014b50, true);
  view.setUint16(4, 20, true);
  view.setUint16(6, 20, true);
  view.setUint16(8, 0, true);
  view.setUint16(10, 0, true);
  view.setUint16(12, dos.time, true);
  view.setUint16(14, dos.date, true);
  view.setUint32(16, input.crc, true);
  view.setUint32(20, input.dataBytes.length, true);
  view.setUint32(24, input.dataBytes.length, true);
  view.setUint16(28, input.nameBytes.length, true);
  view.setUint16(30, 0, true);
  view.setUint16(32, 0, true);
  view.setUint16(34, 0, true);
  view.setUint16(36, 0, true);
  view.setUint32(38, 0, true);
  view.setUint32(42, input.offset, true);
  header.set(input.nameBytes, 46);

  return header;
}

function createEndOfCentralDirectoryRecord(entryCount: number, size: number, offset: number) {
  const record = new Uint8Array(22);
  const view = new DataView(record.buffer);

  view.setUint32(0, 0x06054b50, true);
  view.setUint16(4, 0, true);
  view.setUint16(6, 0, true);
  view.setUint16(8, entryCount, true);
  view.setUint16(10, entryCount, true);
  view.setUint32(12, size, true);
  view.setUint32(16, offset, true);
  view.setUint16(20, 0, true);

  return record;
}

export function createZipArchive(entries: ZipEntry[]) {
  const localParts: Buffer[] = [];
  const centralParts: Buffer[] = [];
  let offset = 0;

  for (const entry of entries) {
    const nameBytes = encoder.encode(entry.name);
    const dataBytes = toBytes(entry.data);
    const crc = crc32(dataBytes);
    const modifiedAt = entry.modifiedAt || new Date();
    const localHeader = createLocalFileHeader({
      nameBytes,
      dataBytes,
      crc,
      modifiedAt,
    });
    const centralHeader = createCentralDirectoryHeader({
      nameBytes,
      dataBytes,
      crc,
      modifiedAt,
      offset,
    });

    localParts.push(Buffer.from(localHeader), Buffer.from(dataBytes));
    centralParts.push(Buffer.from(centralHeader));
    offset += localHeader.length + dataBytes.length;
  }

  const centralDirectory = Buffer.concat(centralParts);
  const endRecord = createEndOfCentralDirectoryRecord(
    entries.length,
    centralDirectory.length,
    offset
  );

  return Buffer.concat([...localParts, centralDirectory, Buffer.from(endRecord)]);
}
