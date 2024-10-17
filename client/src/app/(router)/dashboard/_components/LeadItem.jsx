export function LeadItem({ name, phone, email, commentsLength }) {
  return (
    <div className="flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-4 rounded-md border p-4 bg-white shadow-sm">
      <div className="flex-1 space-y-1">
        <p className="text-lg font-semibold leading-none text-gray-900">
          {name}
        </p>
        <p className="text-sm text-gray-600">
          {phone ? phone : "Phone not available"}
        </p>
        <p className="text-sm text-gray-600">Comments: {commentsLength}</p>
      </div>
      <div className="text-sm text-gray-600 md:text-right w-full md:w-auto">
        <p className="break-words">{email}</p>
      </div>
    </div>
  );
}
